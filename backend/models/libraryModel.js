// JADGE ETHAN ROY SIENES
// FAVORITES, DOWNLOADS, QUEUE, HISTORY (each one is a list of songs per user)
const db = require('../config/db');

// FAVORITES

async function getFavorites(userId) {
  const [rows] = await db.query(
    `SELECT songs.song_id, songs.title AS song_title, artists.artist_name, songs.duration
     FROM favorites
     INNER JOIN songs ON favorites.song_id = songs.song_id
     INNER JOIN artists ON songs.artist_id = artists.artist_id
     WHERE favorites.user_id = ?
     ORDER BY favorites.favorite_id DESC`,
    [userId]
  );
  return rows;
}

async function isFavorite(userId, songId) {
  const [rows] = await db.query('SELECT favorite_id FROM favorites WHERE user_id = ? AND song_id = ?', [userId, songId]);
  return rows.length > 0;
}

async function addFavorite(userId, songId) {
  await db.query('INSERT INTO favorites (user_id, song_id) VALUES (?, ?)', [userId, songId]);
}

async function removeFavorite(userId, songId) {
  await db.query('DELETE FROM favorites WHERE user_id = ? AND song_id = ?', [userId, songId]);
}

// DOWNLOADS

async function getDownloads(userId) {
  const [rows] = await db.query(
    `SELECT downloads.download_id, songs.song_id, songs.title AS song_title, artists.artist_name, songs.duration
     FROM downloads
     INNER JOIN songs ON downloads.song_id = songs.song_id
     INNER JOIN artists ON songs.artist_id = artists.artist_id
     WHERE downloads.user_id = ?
     ORDER BY downloads.download_id DESC`,
    [userId]
  );
  return rows;
}

async function getDownload(downloadId) {
  const [rows] = await db.query('SELECT download_id, user_id FROM downloads WHERE download_id = ?', [downloadId]);
  return rows[0];
}

async function isDownloaded(userId, songId) {
  const [rows] = await db.query('SELECT download_id FROM downloads WHERE user_id = ? AND song_id = ?', [userId, songId]);
  return rows.length > 0;
}

async function addDownload(userId, songId) {
  await db.query('INSERT INTO downloads (user_id, song_id) VALUES (?, ?)', [userId, songId]);
}

async function removeDownload(downloadId) {
  await db.query('DELETE FROM downloads WHERE download_id = ?', [downloadId]);
}

// QUEUE

async function getQueue(userId) {
  const [rows] = await db.query(
    `SELECT queue.queue_id, songs.song_id, songs.title AS song_title, artists.artist_name, songs.duration
     FROM queue
     INNER JOIN songs ON queue.song_id = songs.song_id
     INNER JOIN artists ON songs.artist_id = artists.artist_id
     WHERE queue.user_id = ?
     ORDER BY queue.queue_id`,
    [userId]
  );
  return rows;
}

async function getQueueItem(queueId) {
  const [rows] = await db.query('SELECT queue_id, user_id FROM queue WHERE queue_id = ?', [queueId]);
  return rows[0];
}

async function addToQueue(userId, songId) {
  await db.query('INSERT INTO queue (user_id, song_id) VALUES (?, ?)', [userId, songId]);
}

async function removeFromQueue(queueId) {
  await db.query('DELETE FROM queue WHERE queue_id = ?', [queueId]);
}

async function clearQueue(userId) {
  await db.query('DELETE FROM queue WHERE user_id = ?', [userId]);
}

// HISTORY

async function getHistory(userId) {
  const [rows] = await db.query(
    `SELECT history.history_id, songs.song_id, songs.title AS song_title, artists.artist_name, songs.duration
     FROM history
     INNER JOIN songs ON history.song_id = songs.song_id
     INNER JOIN artists ON songs.artist_id = artists.artist_id
     WHERE history.user_id = ?
     ORDER BY history.history_id DESC
     LIMIT 50`,
    [userId]
  );
  return rows;
}

async function addHistory(userId, songId) {
  await db.query('INSERT INTO history (user_id, song_id) VALUES (?, ?)', [userId, songId]);
}

async function clearHistory(userId) {
  await db.query('DELETE FROM history WHERE user_id = ?', [userId]);
}

module.exports = {
  getFavorites, isFavorite, addFavorite, removeFavorite,
  getDownloads, getDownload, isDownloaded, addDownload, removeDownload,
  getQueue, getQueueItem, addToQueue, removeFromQueue, clearQueue,
  getHistory, addHistory, clearHistory
};