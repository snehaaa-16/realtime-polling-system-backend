const winston = require('winston');
const { format, transports } = winston;
const path = require('path');

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: logFormat,
  transports: [
    // Console — always on
    new transports.Console({
      format: format.combine(format.colorize(), logFormat),
    }),
    // Error log file
    new transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Convenience methods for structured logging
logger.request = (method, url, statusCode, ms) =>
  logger.info(`${method} ${url} ${statusCode} - ${ms}ms`);

logger.socketEvent = (event, userEmail, extra = '') =>
  logger.debug(`[WS] ${event} | ${userEmail}${extra ? ' | ' + extra : ''}`);

module.exports = logger;
