const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index → one vote per user per poll
voteSchema.index({ userId: 1, pollId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
