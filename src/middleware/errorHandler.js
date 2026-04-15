const logger = require('../utils/logger');
const AppError = require('../errors/AppError');
const { config } = require('../config/env');

// ─── Transform known error types into AppError ───────────────────────────────
const handleMongooseDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} already exists.`, 400);
};

const handleMongooseValidation = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message).join(', ');
  return new AppError(messages, 400);
};

const handleJWT = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpired = () => new AppError('Your token has expired. Please log in again.', 401);
const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);

// ─── Send error in development (full detail) ─────────────────────────────────
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

// ─── Send error in production (safe, minimal) ────────────────────────────────
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  // Programming or unknown error — don't leak details
  logger.error('UNEXPECTED ERROR:', err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
};

// ─── Global Error Handler Middleware ─────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`[${req.method}] ${req.originalUrl} → ${err.statusCode}: ${err.message}`);

  if (config.isProduction) {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);

    if (err.code === 11000)             error = handleMongooseDuplicateKey(err);
    if (err.name === 'ValidationError') error = handleMongooseValidation(err);
    if (err.name === 'JsonWebTokenError') error = handleJWT();
    if (err.name === 'TokenExpiredError') error = handleJWTExpired();
    if (err.name === 'CastError')       error = handleCastError(err);

    sendErrorProd(error, res);
  } else {
    sendErrorDev(err, res);
  }
};

module.exports = errorHandler;
