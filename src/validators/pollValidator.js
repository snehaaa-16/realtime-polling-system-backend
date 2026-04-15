const { body, param } = require('express-validator');

const createPollValidator = [
  body('question')
    .trim()
    .notEmpty().withMessage('Question is required.')
    .isLength({ min: 5, max: 300 }).withMessage('Question must be 5–300 characters.'),

  body('options')
    .isArray({ min: 2, max: 10 }).withMessage('Provide between 2 and 10 options.'),

  body('options.*')
    .trim()
    .notEmpty().withMessage('Each option must be a non-empty string.')
    .isLength({ max: 100 }).withMessage('Each option can be at most 100 characters.'),

  body('expiresAt')
    .notEmpty().withMessage('Expiry date is required.')
    .isISO8601().withMessage('Expiry must be a valid ISO8601 date.')
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error('Expiry date must be in the future.');
      }
      return true;
    }),
];

const voteValidator = [
  param('id')
    .isMongoId().withMessage('Invalid poll ID.'),

  body('optionId')
    .notEmpty().withMessage('optionId is required.')
    .isMongoId().withMessage('Invalid option ID.'),
];

const pollIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid poll ID.'),
];

module.exports = { createPollValidator, voteValidator, pollIdValidator };
