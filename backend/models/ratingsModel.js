// GJ-CHYLL MORTE
// RATINGS AND COMMENTS
const db = require('../config/db');

async function getRatings(userId) {
  const [rows] = await db.query(
    `SELECT ratings.rating_id, ratings.song_id, ratings.score, songs.title AS song_title, artists.artist_name
     FROM ratings
     INNER JOIN songs ON ratings.song_id = songs.song_id
     INNER JOIN artists ON songs.artist_id = artists.artist_id
     WHERE ratings.user_id = ?
     ORDER BY ratings.rating_id DESC`,
    [userId]
  );
  return rows;
}

async function getRating(ratingId) {
  const [rows] = await db.query('SELECT rating_id, user_id, song_id, score FROM ratings WHERE rating_id = ?', [ratingId]);
  return rows[0];
}

async function findRating(userId, songId) {
  const [rows] = await db.query('SELECT rating_id FROM ratings WHERE user_id = ? AND song_id = ?', [userId, songId]);
  return rows[0];
}

async function createRating(userId, songId, score) {
  const [result] = await db.query('INSERT INTO ratings (user_id, song_id, score) VALUES (?, ?, ?)', [userId, songId, score]);
  return result.insertId;
}

async function updateRating(ratingId, score) {
  await db.query('UPDATE ratings SET score = ? WHERE rating_id = ?', [score, ratingId]);
}

async function deleteRating(ratingId) {
  await db.query('DELETE FROM ratings WHERE rating_id = ?', [ratingId]);
}

async function getComments(songId) {
  const [rows] = await db.query(
    `SELECT comments.comment_id, comments.user_id, comments.comment_text, users.username
     FROM comments
     INNER JOIN users ON comments.user_id = users.user_id
     WHERE comments.song_id = ?
     ORDER BY comments.comment_id`,
    [songId]
  );
  return rows;
}

async function getComment(commentId) {
  const [rows] = await db.query(
    'SELECT comment_id, user_id, song_id, comment_text FROM comments WHERE comment_id = ?',
    [commentId]
  );
  return rows[0];
}

async function createComment(userId, songId, text) {
  const [result] = await db.query('INSERT INTO comments (user_id, song_id, comment_text) VALUES (?, ?, ?)', [userId, songId, text]);
  return result.insertId;
}

async function updateComment(commentId, text) {
  await db.query('UPDATE comments SET comment_text = ? WHERE comment_id = ?', [text, commentId]);
}

async function deleteComment(commentId) {
  await db.query('DELETE FROM comments WHERE comment_id = ?', [commentId]);
}

module.exports = {
  getRatings, getRating, findRating, createRating, updateRating, deleteRating,
  getComments, getComment, createComment, updateComment, deleteComment
};
