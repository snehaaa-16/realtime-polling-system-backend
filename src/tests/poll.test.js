const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

let adminToken, userToken, pollId, optionId;

// ─── Setup ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/polling_test');

  // Create admin
  await request(app).post('/api/auth/register').send({
    name: 'Admin',
    email: 'admin@polltest.com',
    password: 'admin123',
    role: 'admin',
  });
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@polltest.com',
    password: 'admin123',
  });
  adminToken = adminLogin.body.data.token;

  // Create regular user
  await request(app).post('/api/auth/register').send({
    name: 'Voter',
    email: 'voter@polltest.com',
    password: 'voter123',
  });
  const userLogin = await request(app).post('/api/auth/login').send({
    email: 'voter@polltest.com',
    password: 'voter123',
  });
  userToken = userLogin.body.data.token;
});

afterAll(async () => {
  await User.deleteMany({ email: /@polltest\.com$/ });
  await Poll.deleteMany({});
  await Vote.deleteMany({});
  await mongoose.disconnect();
});

// ─── POST /api/polls ───────────────────────────────────────────────────────
describe('POST /api/polls', () => {
  it('should allow admin to create a poll', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        question: 'Best backend framework?',
        options: ['Express', 'Fastify', 'NestJS'],
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('_id');
    pollId = res.body.data._id;
    optionId = res.body.data.options[0]._id;
  });

  it('should reject poll creation by non-admin', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        question: 'Should users create polls?',
        options: ['Yes', 'No'],
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      });
    expect(res.statusCode).toBe(403);
  });

  it('should reject poll with fewer than 2 options', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        question: 'Single option?',
        options: ['Only one'],
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      });
    expect(res.statusCode).toBe(400);
  });

  it('should reject poll with past expiry date', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        question: 'Past expiry?',
        options: ['Yes', 'No'],
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
    expect(res.statusCode).toBe(400);
  });
});

// ─── GET /api/polls ────────────────────────────────────────────────────────
describe('GET /api/polls', () => {
  it('should return list of active polls', async () => {
    const res = await request(app).get('/api/polls');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─── POST /api/polls/:id/vote ──────────────────────────────────────────────
describe('POST /api/polls/:id/vote', () => {
  it('should allow authenticated user to vote', async () => {
    const res = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ optionId });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject duplicate vote from same user', async () => {
    const res = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ optionId });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject vote without authentication', async () => {
    const res = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .send({ optionId });
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/polls/:id/results ────────────────────────────────────────────
describe('GET /api/polls/:id/results', () => {
  it('should return results with percentages and winner', async () => {
    const res = await request(app).get(`/api/polls/${pollId}/results`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('totalVotes');
    expect(res.body.data).toHaveProperty('results');
    expect(res.body.data).toHaveProperty('winner');
    expect(res.body.data.totalVotes).toBe(1);
  });
});

// ─── DELETE /api/polls/:id ─────────────────────────────────────────────────
describe('DELETE /api/polls/:id', () => {
  it('should allow admin to delete poll', async () => {
    const res = await request(app)
      .delete(`/api/polls/${pollId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  it('should return 404 for deleted poll', async () => {
    const res = await request(app).get(`/api/polls/${pollId}`);
    expect(res.statusCode).toBe(404);
  });
});
