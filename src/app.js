require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { config, validateEnv } = require('./config/env');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const pollRoutes = require('./routes/pollRoutes');
const swaggerSpec = require('./docs/swagger');
const logger = require('./utils/logger');
const AppError = require('./errors/AppError');

// Validate environment on startup
validateEnv();

const app = express();

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(cors({ origin: config.cors.origin }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
if (!config.isProduction) {
  app.use(morgan('dev'));
} else {
  // Production: log to winston
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// ─── Rate Limiters ───────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/polls', pollRoutes);

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Live Polling API Docs',
}));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: config.nodeEnv,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
