require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { config, validateEnv } = require('./config/env');
const initSocket = require('./sockets/pollSocket');
const pubSubService = require('./services/pubsubService');
const logger = require('./utils/logger');

validateEnv();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
  },
});

initSocket(io);

// ─── Boot sequence: DB → Redis → HTTP server ──────────────────────────────
const start = async () => {
  try {
    await connectDB();

    // Connect Redis Pub/Sub (publisher + subscriber clients)
    await pubSubService.connect();

    server.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`🔌 WebSocket server ready`);
      logger.info(`📡 Redis Pub/Sub connected`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    logger.error(`Startup failed: ${err.message}`);
    process.exit(1);
  }
};

start();

// ─── Graceful shutdown ────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.warn(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await pubSubService.disconnect(); // close Redis connections cleanly
    logger.info('Server and Redis closed. Exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
