const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  voteCount: {
    type: Number,
    default: 0,
  },
});

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (opts) => opts.length >= 2,
        message: 'Poll must have at least 2 options',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Virtual: is the poll expired?
pollSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

module.exports = mongoose.model('Poll', pollSchema);
