const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const mongoose = require('mongoose');

describe('Auth API', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/sportanalytics_test');
  }, 10000);

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  }, 10000);

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@t.de', password: 'pw123456' });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  }, 10000);

  it('should not register with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: '', email: '', password: '' });
    expect(res.statusCode).toBe(400);
  }, 10000);

  it('should login with correct credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testlogin', email: 'testlogin@t.de', password: 'pw123456' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testlogin', password: 'pw123456' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  }, 10000);
}); 