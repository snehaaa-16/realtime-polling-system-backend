const pollService = require('./pollService');
const pubSubService = require('./pubsubService');
const { SOCKET_EVENTS } = require('../constants/pollStatus');
const logger = require('../utils/logger');

/**
 * handleJoinPoll
 * - Joins the socket to the local Socket.IO room for this poll
 * - Subscribes THIS SERVER INSTANCE to the Redis channel for this poll
 *   so it receives broadcasts published by ANY other instance
 * - Emits current results immediately to the joining client
 */
const handleJoinPoll = async (io, socket, { pollId }) => {
  if (!pollId) {
    return socket.emit(SOCKET_EVENTS.ERROR, { message: 'pollId is required.' });
  }

  // Join local Socket.IO room
  await socket.join(pollId);
  logger.socketEvent('join_poll', socket.user.email, `poll:${pollId}`);

  // Create a handler that broadcasts Redis messages to the local room
  // Store it on the socket so we can remove it on leave/disconnect
  const redisHandler = ({ results }) => {
    io.to(pollId).emit(SOCKET_EVENTS.POLL_UPDATE, results);
    logger.debug(`[PubSub] Forwarded poll:${pollId} update to local room`);
  };
  socket._redisHandlers = socket._redisHandlers || {};
  socket._redisHandlers[pollId] = redisHandler;

  // Subscribe this instance to the Redis channel (idempotent per channel)
  await pubSubService.subscribeToPoll(pollId, redisHandler);

  // Send current results immediately on join
  const results = await pollService.getPollResults(pollId);
  socket.emit(SOCKET_EVENTS.POLL_UPDATE, results);
};

/**
 * handleVote
 * - Casts the vote via pollService (same as REST endpoint — no duplication)
 * - Fetches fresh results
 * - PUBLISHES to Redis channel → all instances (including this one) receive it
 *   and broadcast to their local rooms
 *
 * This means even if 1000 users are spread across 10 server instances,
 * every one of them sees the update within milliseconds.
 */
const handleVote = async (io, socket, { pollId, optionId }) => {
  if (!pollId || !optionId) {
    return socket.emit(SOCKET_EVENTS.ERROR, { message: 'pollId and optionId are required.' });
  }

  // Cast vote (atomic DB update, duplicate check)
  await pollService.castVote(socket.user._id, pollId, optionId);
  logger.socketEvent('vote', socket.user.email, `poll:${pollId} option:${optionId}`);

  // Fetch fresh results and publish to Redis
  // → All subscribed instances will pick this up and emit to their local rooms
  const results = await pollService.getPollResults(pollId);
  await pubSubService.publishPollUpdate(pollId, results);
};

/**
 * handleLeavePoll
 * - Leaves the local Socket.IO room
 * - Unregisters this socket's Redis handler for the poll
 *   (Redis unsubscribes only when NO handlers remain for that channel)
 */
const handleLeavePoll = async (socket, { pollId }) => {
  socket.leave(pollId);
  logger.socketEvent('leave_poll', socket.user.email, `poll:${pollId}`);

  if (socket._redisHandlers?.[pollId]) {
    await pubSubService.unsubscribeFromPoll(pollId, socket._redisHandlers[pollId]);
    delete socket._redisHandlers[pollId];
  }
};

/**
 * handleDisconnect
 * - Cleans up ALL Redis subscriptions this socket held
 */
const handleDisconnect = async (socket) => {
  if (!socket._redisHandlers) return;
  for (const [pollId, handler] of Object.entries(socket._redisHandlers)) {
    await pubSubService.unsubscribeFromPoll(pollId, handler);
    logger.debug(`[PubSub] Cleaned up handler for poll:${pollId} on disconnect`);
  }
  socket._redisHandlers = {};
};

module.exports = { handleJoinPoll, handleVote, handleLeavePoll, handleDisconnect };
