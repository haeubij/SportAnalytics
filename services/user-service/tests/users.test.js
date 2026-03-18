/**
 * User Service – REST API Tests
 * Tests use mocked MongoDB (jest.mock) and mocked Kafka to avoid external dependencies.
 */

// ── Mock Kafka before anything imports it ────────────────────────────────────
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

// ── Mock Mongoose ─────────────────────────────────────────────────────────────
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({})
  };
});

const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Helpers ───────────────────────────────────────────────────────────────────
const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-users';

function makeToken(payload) {
  return jwt.sign({ user: payload }, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = makeToken({ id: 'admin-id-123', role: 'admin' });
const userToken  = makeToken({ id: 'user-id-456',  role: 'user'  });

// ── Mock User model ───────────────────────────────────────────────────────────
const mockUsers = [
  { _id: 'user-id-456', username: 'testuser', email: 'test@example.com', role: 'user', isActive: true },
  { _id: 'admin-id-123', username: 'admin', email: 'admin@example.com', role: 'admin', isActive: true }
];

jest.mock('../src/models/User', () => {
  // Creates a Promise that also has a .select() chainable method.
  // This supports both:
  //   await User.findById(id)              → resolves to user
  //   await User.findById(id).select(...)  → resolves to user
  const makeQuery = (result) => {
    const p = Promise.resolve(result);
    p.select = jest.fn().mockResolvedValue(result);
    return p;
  };

  const makeUser = (raw) => raw
    ? { ...raw, save: jest.fn().mockResolvedValue(true) }
    : null;

  return {
    find: jest.fn().mockReturnValue(makeQuery(mockUsers.map(u => ({ ...u })))),
    findById: jest.fn().mockImplementation((id) => {
      const user = mockUsers.find(u => u._id === id);
      return makeQuery(makeUser(user));
    }),
    findByIdAndUpdate: jest.fn().mockImplementation((id) => {
      const user = mockUsers.find(u => u._id === id);
      return makeQuery(user ? { ...user } : null);
    }),
    findByIdAndDelete: jest.fn().mockResolvedValue(true),
    findOneAndUpdate: jest.fn().mockResolvedValue(true)
  };
});

// ── Load app after mocks are in place ────────────────────────────────────────
const app = require('../src/server');

// ─────────────────────────────────────────────────────────────────────────────

describe('User Service API', () => {

  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('user-service');
    });
  });

  // ── GET /api/users ──────────────────────────────────────────────────────────
  describe('GET /api/users', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('x-auth-token', userToken);
      expect(res.status).toBe(403);
    });

    it('should return all users for admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('x-auth-token', adminToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /api/users/me ───────────────────────────────────────────────────────
  describe('GET /api/users/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    it('should return own profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('x-auth-token', userToken);
      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/users/:id ──────────────────────────────────────────────────────
  describe('GET /api/users/:id', () => {
    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/users/user-id-456')
        .set('x-auth-token', userToken);
      expect(res.status).toBe(403);
    });

    it('should return user for admin', async () => {
      const res = await request(app)
        .get('/api/users/user-id-456')
        .set('x-auth-token', adminToken);
      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent user', async () => {
      const User = require('../src/models/User');
      User.findById.mockReturnValueOnce({ _result: null, select: jest.fn().mockReturnValue(null) });

      const res = await request(app)
        .get('/api/users/nonexistent-id')
        .set('x-auth-token', adminToken);
      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/users/:id ──────────────────────────────────────────────────────
  describe('PUT /api/users/:id', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).put('/api/users/user-id-456').send({ username: 'new' });
      expect(res.status).toBe(401);
    });

    it('should return 403 when editing another user as non-admin', async () => {
      const res = await request(app)
        .put('/api/users/admin-id-123')
        .set('x-auth-token', userToken)
        .send({ username: 'hacked' });
      expect(res.status).toBe(403);
    });

    it('should allow user to update own profile', async () => {
      const res = await request(app)
        .put('/api/users/user-id-456')
        .set('x-auth-token', userToken)
        .send({ username: 'updatedname' });
      expect(res.status).toBe(200);
    });
  });

  // ── PUT /api/users/:id/role ─────────────────────────────────────────────────
  describe('PUT /api/users/:id/role', () => {
    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .put('/api/users/user-id-456/role')
        .set('x-auth-token', userToken)
        .send({ role: 'admin' });
      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid role', async () => {
      const res = await request(app)
        .put('/api/users/user-id-456/role')
        .set('x-auth-token', adminToken)
        .send({ role: 'superuser' });
      expect(res.status).toBe(400);
    });

    it('should update role for admin', async () => {
      const res = await request(app)
        .put('/api/users/user-id-456/role')
        .set('x-auth-token', adminToken)
        .send({ role: 'admin' });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/admin/);
    });
  });

  // ── PUT /api/users/:id/status ───────────────────────────────────────────────
  describe('PUT /api/users/:id/status', () => {
    it('should return 400 when isActive is missing', async () => {
      const res = await request(app)
        .put('/api/users/user-id-456/status')
        .set('x-auth-token', adminToken)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should update status for admin', async () => {
      const res = await request(app)
        .put('/api/users/user-id-456/status')
        .set('x-auth-token', adminToken)
        .send({ isActive: false });
      expect(res.status).toBe(200);
    });
  });

  // ── DELETE /api/users/:id ───────────────────────────────────────────────────
  describe('DELETE /api/users/:id', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).delete('/api/users/user-id-456');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .delete('/api/users/user-id-456')
        .set('x-auth-token', userToken);
      expect(res.status).toBe(403);
    });

    it('should return 400 when admin tries to delete own account', async () => {
      const res = await request(app)
        .delete('/api/users/admin-id-123')
        .set('x-auth-token', adminToken);
      expect(res.status).toBe(400);
    });

    it('should delete user and return 200 for admin', async () => {
      const res = await request(app)
        .delete('/api/users/user-id-456')
        .set('x-auth-token', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });
  });
});
