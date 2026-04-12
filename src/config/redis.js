const { createClient } = require('redis');
const logger = require('../utils/logger');
const { config } = require('./env');

// ─── Factory: create and connect a redis client ───────────────────────────────
// We need TWO separate clients: one for publishing, one for subscribing.
// A client that has called .subscribe() cannot issue regular commands.
const createRedisClient = async (label = 'redis') => {
  const client = createClient({
    url: config.redis.url,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error(`[${label}] Max reconnect attempts reached. Giving up.`);
          return new Error('Max redis reconnect attempts reached.');
        }
        const delay = Math.min(retries * 100, 3000); // exponential back-off, max 3s
        logger.warn(`[${label}] Reconnecting in ${delay}ms (attempt ${retries})...`);
        return delay;
      },
    },
  });

  client.on('error', (err) => logger.error(`[${label}] Error: ${err.message}`));
  client.on('connect', () => logger.info(`[${label}] Connected to Redis`));
  client.on('reconnecting', () => logger.warn(`[${label}] Reconnecting...`));
  client.on('end', () => logger.info(`[${label}] Connection closed`));

  await client.connect();
  return client;
};

module.exports = { createRedisClient };
