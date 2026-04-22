/**
 * Video Service – REST API Tests
 * Kafka, Mongoose und GridFSBucket werden gemockt.
 */

jest.mock('kafkajs', () => {
  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    subscribe: jest.fn().mockResolvedValue(),
    run: jest.fn().mockResolvedValue()
  };
  return {
    Kafka: jest.fn().mockImplementation(() => ({
      consumer: () => mockConsumer
    }))
  };
});

const mockFile = {
  _id: 'file-id-123',
  filename: 'test.mp4',
  length: 1024,
  uploadDate: new Date(),
  metadata: {
    uploadedBy: 'user-id-456',
    title: 'TestVideo',
    description: 'Training',
    sport: 'football',
    contentType: 'video/mp4'
  }
};

const mockUploadStream = {
  id: 'file-id-123',
  end: jest.fn(function() { this.emit('finish'); return this; }),
  on: jest.fn(function(event, cb) {
    if (event === 'finish') { process.nextTick(cb); }
    return this;
  })
};

const mockBucket = {
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([mockFile]) }),
    toArray: jest.fn().mockResolvedValue([mockFile])
  }),
  openUploadStream: jest.fn().mockReturnValue(mockUploadStream),
  openDownloadStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
  delete: jest.fn().mockResolvedValue()
};

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({}),
    connection: { db: {} },
    mongo: {
      GridFSBucket: jest.fn().mockImplementation(() => mockBucket)
    }
  };
});

const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-videos';

function makeToken(payload) {
  return jwt.sign({ user: payload }, JWT_SECRET, { expiresIn: '1h' });
}

const userToken  = makeToken({ id: 'user-id-456', role: 'user' });
const adminToken = makeToken({ id: 'admin-id-123', role: 'admin' });

const app = require('../src/server');

describe('Video Service API', () => {

  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('video-service');
    });
  });

  describe('GET /api/videos', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/videos');
      expect(res.status).toBe(401);
    });

    it('should return list of videos for authenticated user', async () => {
      const res = await request(app)
        .get('/api/videos')
        .set('x-auth-token', userToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/videos/my', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/videos/my');
      expect(res.status).toBe(401);
    });

    it('should return own videos for authenticated user', async () => {
      const res = await request(app)
        .get('/api/videos/my')
        .set('x-auth-token', userToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/videos', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/videos').send({});
      expect(res.status).toBe(401);
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/videos')
        .set('x-auth-token', userToken)
        .send({ data: 'AAAA', filename: 'test.mp4', contentType: 'video/mp4' });
      expect(res.status).toBe(400);
    });

    it('should return 400 when data field is missing', async () => {
      const res = await request(app)
        .post('/api/videos')
        .set('x-auth-token', userToken)
        .send({ title: 'TestVideo' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/videos/:id', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).delete('/api/videos/file-id-123');
      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid video ID', async () => {
      mockBucket.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([])
      });
      const res = await request(app)
        .delete('/api/videos/invalid-id')
        .set('x-auth-token', userToken);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/videos/admin/all', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/videos/admin/all');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/videos/admin/all')
        .set('x-auth-token', userToken);
      expect(res.status).toBe(403);
    });
  });
});
