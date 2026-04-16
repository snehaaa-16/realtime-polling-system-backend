const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

// ─── Setup / Teardown ──────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/polling_test');
});

afterAll(async () => {
  await User.deleteMany({ email: /@test\.com$/ });
  await mongoose.disconnect();
});

// ─── POST /api/auth/register ───────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('should register a new user and return a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password1',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('user@test.com');
    expect(res.body.data.user.role).toBe('user');
  });

  it('should reject duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password1',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'not-an-email',
      password: 'password1',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'short@test.com',
      password: '12',
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'user@test.com',
      password: 'password1',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'user@test.com',
      password: 'wrongpassword',
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@test.com',
      password: 'password1',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'user@test.com',
      password: 'password1',
    });
    token = res.body.data.token;
  });

  it('should return current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('user@test.com');
  });

  it('should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.statusCode).toBe(401);
  });
});
