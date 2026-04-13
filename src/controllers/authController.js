const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, 201, 'User registered successfully.', result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, 200, 'Login successful.', result);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  return successResponse(res, 200, 'User fetched.', {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
};

module.exports = { register, login, getMe };
