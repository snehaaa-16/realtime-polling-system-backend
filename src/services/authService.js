const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepository');
const { config } = require('../config/env');
const { badRequest, unauthorized } = require('../errors/errorTypes');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const register = async ({ name, email, password, role }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw badRequest('Email already registered.');

  const user = await userRepo.createUser({ name, email, password, role });
  const token = generateToken(user._id);
  return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token };
};

const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user || !(await user.comparePassword(password))) {
    throw unauthorized('Invalid email or password.');
  }

  const token = generateToken(user._id);
  return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token };
};

module.exports = { register, login };
