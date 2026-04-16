const Vote = require('../models/Vote');

const createVote = (data) => Vote.create(data);

const findExistingVote = (userId, pollId) => Vote.findOne({ userId, pollId });

module.exports = { createVote, findExistingVote };
