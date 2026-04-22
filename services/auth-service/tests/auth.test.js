/**
 * Auth Service – REST API Tests
 * Kafka und Mongoose werden gemockt um externe Abhängigkeiten zu vermeiden.
 */

jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    send: jest.fn().mockResolvedValue()
  };
  return {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: () => mockProducer
    }))
  };
});

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({})
  };
});

const mockSavedUser = {
  _id: 'user-id-123',
  username: 'testuser',
  email: 'testuser@sport.ch',
  role: 'user',
  isActive: true,
  lastLogin: null,
  save: jest.fn().mockResolvedValue(true),
  comparePassword: jest.fn().mockResolvedValue(true)
};

const MockUser = jest.fn().mockImplementation(() => mockSavedUser);
MockUser.findOne = jest.fn().mockResolvedValue(null);
MockUser.findById = jest.fn().mockReturnValue({
  select: jest.fn().mockResolvedValue(mockSavedUser)
});

jest.mock('../src/models/User', () => MockUser);

const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-auth';

function makeToken(payload) {
  return jwt.sign({ user: payload }, JWT_SECRET, { expiresIn: '1h' });
}

const userToken = makeToken({ id: 'user-id-123', role: 'user' });

const app = require('../src/server');

describe('Auth Service API', () => {

  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('auth-service');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 when fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@sport.ch' });
      expect(res.status).toBe(400);
    });

    it('should return 409 when email already exists', async () => {
      MockUser.findOne.mockResolvedValueOnce({
        email: 'testuser@sport.ch',
        username: 'testuser'
      });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'testuser@sport.ch', password: 'password123' });
      expect(res.status).toBe(409);
    });

    it('should register a new user and return token', async () => {
      MockUser.findOne.mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', email: 'new@sport.ch', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 when fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@sport.ch' });
      expect(res.status).toBe(400);
    });

    it('should return 401 when user does not exist', async () => {
      MockUser.findOne.mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@sport.ch', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('should return 401 when password is wrong', async () => {
      MockUser.findOne.mockResolvedValueOnce({
        ...mockSavedUser,
        comparePassword: jest.fn().mockResolvedValue(false)
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser@sport.ch', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('should return 403 when account is deactivated', async () => {
      MockUser.findOne.mockResolvedValueOnce({
        ...mockSavedUser,
        isActive: false
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser@sport.ch', password: 'password123' });
      expect(res.status).toBe(403);
    });

    it('should return token on successful login', async () => {
      MockUser.findOne.mockResolvedValueOnce(mockSavedUser);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser@sport.ch', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('testuser@sport.ch');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return own profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('x-auth-token', userToken);
      expect(res.status).toBe(200);
      expect(res.body.username).toBeDefined();
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('x-auth-token', 'invalidtoken');
      expect(res.status).toBe(401);
    });
  });
});
