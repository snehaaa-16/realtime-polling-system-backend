const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const validate = require('../middleware/validate');

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
