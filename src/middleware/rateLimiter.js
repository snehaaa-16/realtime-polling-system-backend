const rateLimit = require('express-rate-limit');
const { config } = require('../config/env');

// General API limiter
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Strict limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Vote limiter (prevent spam voting across polls)
const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.rateLimit.voteMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Voting too fast. Slow down.' },
});

module.exports = { apiLimiter, authLimiter, voteLimiter };
