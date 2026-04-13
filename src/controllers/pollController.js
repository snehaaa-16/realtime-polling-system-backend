const pollService = require('../services/pollService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const createPoll = async (req, res, next) => {
  try {
    const poll = await pollService.createPoll(req.body, req.user._id);
    return successResponse(res, 201, 'Poll created.', poll);
  } catch (err) {
    next(err);
  }
};

const getAllPolls = async (req, res, next) => {
  try {
    const polls = await pollService.getAllPolls();
    return successResponse(res, 200, 'Polls fetched.', polls);
  } catch (err) {
    next(err);
  }
};

const getPollById = async (req, res, next) => {
  try {
    const poll = await pollService.getPollById(req.params.id);
    return successResponse(res, 200, 'Poll fetched.', poll);
  } catch (err) {
    next(err);
  }
};

const deletePoll = async (req, res, next) => {
  try {
    await pollService.deletePoll(req.params.id);
    return successResponse(res, 200, 'Poll deleted.');
  } catch (err) {
    next(err);
  }
};

const getPollResults = async (req, res, next) => {
  try {
    const results = await pollService.getPollResults(req.params.id);
    return successResponse(res, 200, 'Results fetched.', results);
  } catch (err) {
    next(err);
  }
};

const castVote = async (req, res, next) => {
  try {
    const updatedPoll = await pollService.castVote(req.user._id, req.params.id, req.body.optionId);
    return successResponse(res, 200, 'Vote cast successfully.', updatedPoll);
  } catch (err) {
    next(err);
  }
};

module.exports = { createPoll, getAllPolls, getPollById, deletePoll, getPollResults, castVote };
