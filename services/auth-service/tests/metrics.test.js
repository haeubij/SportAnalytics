jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    send: jest.fn().mockResolvedValue()
  };
  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    subscribe: jest.fn().mockResolvedValue(),
    run: jest.fn().mockResolvedValue()
  };
  return {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: () => mockProducer,
      consumer: () => mockConsumer
    }))
  };
});

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return { ...actual, connect: jest.fn().mockResolvedValue({}) };
});

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-auth';

const request = require('supertest');
const app = require('../src/server');

describe('GET /metrics', () => {
  it('returns 200 with prometheus text format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });
});

describe('Tracing middleware', () => {
  it('sets X-Trace-Id header on every response', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-trace-id']).toBeDefined();
    expect(res.headers['x-trace-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique traceId per request', async () => {
    const [res1, res2] = await Promise.all([
      request(app).get('/health'),
      request(app).get('/health')
    ]);
    expect(res1.headers['x-trace-id']).not.toBe(res2.headers['x-trace-id']);
  });
});
