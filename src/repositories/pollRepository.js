const Poll = require('../models/Poll');

const createPoll = (data) => Poll.create(data);

const findAllActive = () =>
  Poll.find({ isActive: true, expiresAt: { $gt: new Date() } })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

const findById = (id) => Poll.findById(id).populate('createdBy', 'name email');

const deletePoll = (id) => Poll.findByIdAndDelete(id);

// Atomically increment vote count for a specific option
const incrementVote = (pollId, optionId) =>
  Poll.findOneAndUpdate(
    { _id: pollId, 'options._id': optionId },
    {
      $inc: {
        'options.$.voteCount': 1,
        totalVotes: 1,
      },
    },
    { new: true }
  );

module.exports = { createPoll, findAllActive, findById, deletePoll, incrementVote };
