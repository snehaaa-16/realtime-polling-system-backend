const User = require('../models/User');

const createUser = (data) => User.create(data);

const findByEmail = (email) => User.findOne({ email }).select('+password');

const findById = (id) => User.findById(id);

module.exports = { createUser, findByEmail, findById };
