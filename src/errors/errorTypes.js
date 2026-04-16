const AppError = require('./AppError');

const notFound = (resource = 'Resource') =>
  new AppError(`${resource} not found.`, 404);

const unauthorized = (msg = 'Unauthorized. Please log in.') =>
  new AppError(msg, 401);

const forbidden = (msg = 'You do not have permission to perform this action.') =>
  new AppError(msg, 403);

const badRequest = (msg) => new AppError(msg, 400);

const conflict = (msg) => new AppError(msg, 409);

module.exports = { notFound, unauthorized, forbidden, badRequest, conflict };
