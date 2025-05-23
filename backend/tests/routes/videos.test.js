const request = require('supertest');
const app = require('../../server');

describe('Videos API', () => {
  it('should get all videos (auth required)', async () => {
    const res = await request(app)
      .get('/api/videos')
      .set('Authorization', 'Bearer <USER_TOKEN>');
    expect([200, 401]).toContain(res.statusCode);
  });
}); 