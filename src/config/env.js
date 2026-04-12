const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  mongo: {
    uri: process.env.MONGO_URI,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    voteMax: parseInt(process.env.RATE_LIMIT_VOTE_MAX, 10) || 20,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  // Redis — used for Pub/Sub WebSocket scaling across multiple instances
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    // Set REDIS_ENABLED=false in .env to run without Redis (single-instance mode)
    enabled: process.env.REDIS_ENABLED !== 'false',
  },
};

module.exports = { config, validateEnv };
