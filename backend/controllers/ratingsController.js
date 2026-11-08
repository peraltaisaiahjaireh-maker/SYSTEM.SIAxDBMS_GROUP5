// GJ-CHYLL MORTE
// RATINGS AND COMMENTS
const { sendSuccess, handleError, makeError, cleanText, cleanNumber, cleanScore, loadSong } = require('./helpers');
const model = require('../models/ratingsModel');

async function loadMyRating(req) {
  const rating = await model.getRating(cleanNumber(req.params.id, 'Rating id'));
  if (!rating) {
    throw makeError(404, 'Rating not found');
  }
  if (rating.user_id !== req.user.user_id) {
    throw makeError(403, 'This rating belongs to another user');
  }
  return rating;
}

async function listRatings(req, res) {
  try {
    sendSuccess(res, 200, 'Ratings loaded', await model.getRatings(req.user.user_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function createRating(req, res) {
  try {
    const songId = cleanNumber(req.body.song_id, 'Song');
    const score = cleanScore(req.body.score);
    await loadSong(songId);
    if (await model.findRating(req.user.user_id, songId)) {
      throw makeError(400, 'You already rated this song. Edit your rating instead.');
    }
    const ratingId = await model.createRating(req.user.user_id, songId, score);
    sendSuccess(res, 201, 'Rating saved', await model.getRating(ratingId));
  } catch (err) {
    handleError(res, err);
  }
}

async function updateRating(req, res) {
  try {
    const rating = await loadMyRating(req);
    const score = cleanScore(req.body.score);
    await model.updateRating(rating.rating_id, score);
    sendSuccess(res, 200, 'Rating updated', await model.getRating(rating.rating_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function deleteRating(req, res) {
  try {
    const rating = await loadMyRating(req);
    await model.deleteRating(rating.rating_id);
    sendSuccess(res, 200, 'Rating deleted', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function loadMyComment(req) {
  const comment = await model.getComment(cleanNumber(req.params.id, 'Comment id'));
  if (!comment) {
    throw makeError(404, 'Comment not found');
  }
  if (comment.user_id !== req.user.user_id) {
    throw makeError(403, 'This comment belongs to another user');
  }
  return comment;
}

async function listComments(req, res) {
  try {
    const songId = cleanNumber(req.params.id, 'Song id');
    await loadSong(songId);
    sendSuccess(res, 200, 'Comments loaded', await model.getComments(songId));
  } catch (err) {
    handleError(res, err);
  }
}

async function createComment(req, res) {
  try {
    const songId = cleanNumber(req.params.id, 'Song id');
    const text = cleanText(req.body.comment_text, 'Comment', 500);
    await loadSong(songId);
    const commentId = await model.createComment(req.user.user_id, songId, text);
    sendSuccess(res, 201, 'Comment added', await model.getComment(commentId));
  } catch (err) {
    handleError(res, err);
  }
}

async function updateComment(req, res) {
  try {
    const comment = await loadMyComment(req);
    const text = cleanText(req.body.comment_text, 'Comment', 500);
    await model.updateComment(comment.comment_id, text);
    sendSuccess(res, 200, 'Comment updated', await model.getComment(comment.comment_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function deleteComment(req, res) {
  try {
    const comment = await loadMyComment(req);
    await model.deleteComment(comment.comment_id);
    sendSuccess(res, 200, 'Comment deleted', null);
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = {
  listRatings, createRating, updateRating, deleteRating,
  listComments, createComment, updateComment, deleteComment
};