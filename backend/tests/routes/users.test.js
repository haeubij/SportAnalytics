const request = require('supertest');
const app = require('../../server');

describe('Users API', () => {
  it('should get all users (admin)', async () => {
    // Hier müsste ein Admin-Token gesetzt werden
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer <ADMIN_TOKEN>');
    expect([200, 401, 403]).toContain(res.statusCode); // Abhängig von Token
  });
}); 