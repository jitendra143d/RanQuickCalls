const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Authentication API Endpoint Tests', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    ageRange: '18-25',
    languageLevel: 'Intermediate'
  };

  afterAll(async () => {
    // Clean up test records
    await User.deleteMany({ username: /^testuser_/ });
    // Close database connection cleanly to prevent Jest open handle alerts
    await mongoose.connection.close();
  });

  test('POST /api/auth/register - Should register a new account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe(testUser.username);
  });

  test('POST /api/auth/login - Should authenticate with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/auth/guest - Should allow guest login with age range', async () => {
    const res = await request(app)
      .post('/api/auth/guest')
      .send({
        ageRange: '25-30',
        languageLevel: 'Advanced'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.isGuest).toBe(true);
  });
});
