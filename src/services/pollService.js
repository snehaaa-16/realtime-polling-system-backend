const pollRepo = require('../repositories/pollRepository');
const voteRepo = require('../repositories/voteRepository');
const { notFound, badRequest, conflict } = require('../errors/errorTypes');

const createPoll = async ({ question, options, expiresAt }, userId) => {
  const optionDocs = options.map((text) => ({ text }));
  return pollRepo.createPoll({ question, options: optionDocs, createdBy: userId, expiresAt });
};

const getAllPolls = () => pollRepo.findAllActive();

const getPollById = async (id) => {
  const poll = await pollRepo.findById(id);
  if (!poll) throw notFound('Poll');
  return poll;
};

const deletePoll = async (id) => {
  const poll = await pollRepo.findById(id);
  if (!poll) throw notFound('Poll');
  await pollRepo.deletePoll(id);
};

const getPollResults = async (id) => {
  const poll = await pollRepo.findById(id);
  if (!poll) throw notFound('Poll');

  const results = poll.options.map((opt) => ({
    optionId: opt._id,
    text: opt.text,
    voteCount: opt.voteCount,
    percentage: poll.totalVotes > 0 ? ((opt.voteCount / poll.totalVotes) * 100).toFixed(2) : '0.00',
  }));

  const winner = results.reduce((max, opt) => (opt.voteCount > max.voteCount ? opt : max), results[0]);
  return { question: poll.question, totalVotes: poll.totalVotes, results, winner };
};

const castVote = async (userId, pollId, optionId) => {
  const poll = await pollRepo.findById(pollId);
  if (!poll) throw notFound('Poll');
  if (!poll.isActive || new Date() > poll.expiresAt) {
    throw badRequest('This poll has expired.');
  }

  const optionExists = poll.options.some((o) => o._id.toString() === optionId);
  if (!optionExists) throw badRequest('Invalid option.');

  const alreadyVoted = await voteRepo.findExistingVote(userId, pollId);
  if (alreadyVoted) throw conflict('You have already voted on this poll.');

  await voteRepo.createVote({ userId, pollId, optionId });
  const updatedPoll = await pollRepo.incrementVote(pollId, optionId);
  return updatedPoll;
};

module.exports = { createPoll, getAllPolls, getPollById, deletePoll, getPollResults, castVote };
