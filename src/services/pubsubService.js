const { createRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * PubSubService — wraps Redis Pub/Sub for Socket.IO horizontal scaling.
 *
 * WHY THIS EXISTS:
 *   Without Redis, Socket.IO rooms only exist in memory of ONE server process.
 *   If you run 3 API instances behind a load balancer:
 *     - User A connects to Instance 1
 *     - User B connects to Instance 2
 *     - User A votes → Instance 1 broadcasts → User B NEVER sees it ❌
 *
 *   With Redis Pub/Sub:
 *     - Instance 1 PUBLISHES the update to Redis channel "poll:<pollId>"
 *     - ALL instances SUBSCRIBE to that channel
 *     - Every instance broadcasts to its own local socket rooms ✅
 *
 * CHANNELS:
 *   poll:<pollId>  →  carries serialized poll result payloads
 */
class PubSubService {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
    // Map of channelName → Set of handler functions
    this._handlers = new Map();
  }

  // ─── Initialize both clients ───────────────────────────────────────────────
  async connect() {
    this.publisher = await createRedisClient('redis:pub');
    this.subscriber = await createRedisClient('redis:sub');

    // Wire incoming messages → registered handlers
    this.subscriber.on('message', (channel, rawMessage) => {
      this._dispatch(channel, rawMessage);
    });

    logger.info('[PubSub] Publisher and subscriber ready');
  }

  // ─── Publish a poll result update to all server instances ─────────────────
  async publishPollUpdate(pollId, results) {
    if (!this.publisher) throw new Error('PubSubService not connected.');
    const channel = `poll:${pollId}`;
    const payload = JSON.stringify({ pollId, results, ts: Date.now() });
    await this.publisher.publish(channel, payload);
    logger.debug(`[PubSub] Published to ${channel}`);
  }

  // ─── Subscribe this instance to a poll channel ────────────────────────────
  async subscribeToPoll(pollId, handler) {
    if (!this.subscriber) throw new Error('PubSubService not connected.');
    const channel = `poll:${pollId}`;

    // Register handler
    if (!this._handlers.has(channel)) {
      this._handlers.set(channel, new Set());
      // Only call Redis SUBSCRIBE once per channel
      await this.subscriber.subscribe(channel);
      logger.debug(`[PubSub] Subscribed to channel: ${channel}`);
    }

    this._handlers.get(channel).add(handler);
  }

  // ─── Unsubscribe from a poll channel (when last socket leaves) ────────────
  async unsubscribeFromPoll(pollId, handler) {
    const channel = `poll:${pollId}`;
    const handlers = this._handlers.get(channel);
    if (!handlers) return;

    handlers.delete(handler);

    // Only unsubscribe from Redis when NO handlers remain for this channel
    if (handlers.size === 0) {
      this._handlers.delete(channel);
      await this.subscriber.unsubscribe(channel);
      logger.debug(`[PubSub] Unsubscribed from channel: ${channel}`);
    }
  }

  // ─── Internal: dispatch a message to all handlers for a channel ────────────
  _dispatch(channel, rawMessage) {
    const handlers = this._handlers.get(channel);
    if (!handlers || handlers.size === 0) return;

    let parsed;
    try {
      parsed = JSON.parse(rawMessage);
    } catch {
      logger.error(`[PubSub] Failed to parse message on ${channel}: ${rawMessage}`);
      return;
    }

    handlers.forEach((fn) => {
      try {
        fn(parsed);
      } catch (err) {
        logger.error(`[PubSub] Handler error on ${channel}: ${err.message}`);
      }
    });
  }

  // ─── Graceful shutdown ─────────────────────────────────────────────────────
  async disconnect() {
    await this.publisher?.quit();
    await this.subscriber?.quit();
    logger.info('[PubSub] Disconnected from Redis');
  }
}

// Singleton — one PubSubService per server process
const pubSubService = new PubSubService();
module.exports = pubSubService;
