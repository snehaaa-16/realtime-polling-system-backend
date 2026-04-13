const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { voteLimiter } = require('../middleware/rateLimiter');
const { createPollValidator, voteValidator, pollIdValidator } = require('../validators/pollValidator');
const validate = require('../middleware/validate');
const ROLES = require('../constants/roles');

// Public
router.get('/', pollController.getAllPolls);
router.get('/:id', pollIdValidator, validate, pollController.getPollById);
router.get('/:id/results', pollIdValidator, validate, pollController.getPollResults);

// Authenticated users — vote (with strict rate limiter)
router.post('/:id/vote', authMiddleware, voteLimiter, voteValidator, validate, pollController.castVote);

// Admin only
router.post('/', authMiddleware, roleMiddleware(ROLES.ADMIN), createPollValidator, validate, pollController.createPoll);
router.delete('/:id', authMiddleware, roleMiddleware(ROLES.ADMIN), pollIdValidator, validate, pollController.deletePoll);

module.exports = router;
