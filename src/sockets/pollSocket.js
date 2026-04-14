const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  handleJoinPoll,
  handleVote,
  handleLeavePoll,
  handleDisconnect,
} = require('../services/socketService');
const { SOCKET_EVENTS } = require('../constants/pollStatus');
const { config } = require('../config/env');
const logger = require('../utils/logger');

const initSocket = (io) => {

  // ─── Socket Auth Middleware ──────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing.'));

      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found.'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token.'));
    }
  });

  // ─── Connection ──────────────────────────────────────────────────────────
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.info(`[SOCKET] Connected: ${socket.id} | User: ${socket.user.email}`);

    // join_poll → subscribe to Redis channel + send current results
    socket.on(SOCKET_EVENTS.JOIN_POLL, async (data) => {
      try {
        await handleJoinPoll(io, socket, data);
      } catch (err) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Failed to join poll.' });
      }
    });

    // vote → cast vote + publish update to Redis (all instances broadcast)
    socket.on(SOCKET_EVENTS.VOTE, async (data) => {
      try {
        await handleVote(io, socket, data);
      } catch (err) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Vote failed.' });
      }
    });

    // leave_poll → leave room + unregister Redis handler
    socket.on(SOCKET_EVENTS.LEAVE_POLL, async (data) => {
      try {
        await handleLeavePoll(socket, data);
      } catch (err) {
        logger.error(`[SOCKET] leave_poll error: ${err.message}`);
      }
    });

    // disconnect → clean up ALL Redis subscriptions for this socket
    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      logger.info(`[SOCKET] Disconnected: ${socket.id}`);
      try {
        await handleDisconnect(socket);
      } catch (err) {
        logger.error(`[SOCKET] disconnect cleanup error: ${err.message}`);
      }
    });
  });
};

module.exports = initSocket;
