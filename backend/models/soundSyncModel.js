// this file talks to the MySQL database. All SQL queries are here.
const db = require('../config/db');


/////////////////////////////////////////////////////////////////////////////////////////JHERALD

// USERS, PROFILE, SETTINGS
async function findUserByEmail(email) {
  const [rows] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
  return rows[0];
}

async function createUser(username, email, password) {
  const [result] = await db.query(
    'INSERT INTO users (username, email, password) VALUES (?, ?, SHA2(?, 256))',
    [username, email, password]
  );
  const userId = result.insertId;
  // every new user also gets a profile row and a settings row
  await db.query("INSERT INTO profile (user_id, bio) VALUES (?, '')", [userId]);
  await db.query('INSERT INTO settings (user_id) VALUES (?)', [userId]);
  return userId;
}

async function loginUser(email, password) {
  const [rows] = await db.query(
    'SELECT user_id, username FROM users WHERE email = ? AND password = SHA2(?, 256)',
    [email, password]
  );
  return rows[0];
}

async function getUser(userId) {
  const [rows] = await db.query('SELECT user_id, username, email FROM users WHERE user_id = ?', [userId]);
  return rows[0];
}

async function getProfile(userId) {
  const [rows] = await db.query('SELECT bio FROM profile WHERE user_id = ?', [userId]);
  return rows[0];
}

async function getSettings(userId) {
  const [rows] = await db.query('SELECT theme FROM settings WHERE user_id = ?', [userId]);
  return rows[0];
}

async function updateUser(userId, username, email) {
  await db.query('UPDATE users SET username = ?, email = ? WHERE user_id = ?', [username, email, userId]);
}

async function updateBio(userId, bio) {
  await db.query('UPDATE profile SET bio = ? WHERE user_id = ?', [bio, userId]);
}

async function updateTheme(userId, theme) {
  await db.query('UPDATE settings SET theme = ? WHERE user_id = ?', [theme, userId]);
}

async function deleteUser(userId) {
  // The foreign keys do not allow deleting a user who still has data,
  // so the user's rows in the other tables are deleted first.
  await db.query(
    'DELETE FROM playlist_songs WHERE playlist_id IN (SELECT playlist_id FROM playlists WHERE user_id = ?)',
    [userId]
  );
  const tables = ['playlists', 'favorites', 'history', 'ratings', 'comments', 'queue', 'downloads', 'profile', 'settings'];
  for (let i = 0; i < tables.length; i++) {
    await db.query('DELETE FROM ' + tables[i] + ' WHERE user_id = ?', [userId]);
  }
  await db.query('DELETE FROM users WHERE user_id = ?', [userId]);
}
//////////////////////////////////////////////////////////////////////////////////////SUPERIO
// PLAYLISTS

async function getPlaylists(userId) {
  const [rows] = await db.query(
    'SELECT playlist_id, user_id, playlist_name FROM playlists WHERE user_id = ? ORDER BY playlist_name',
    [userId]
  );
  return rows;
}

async function getPlaylist(playlistId) {
  const [rows] = await db.query(
    'SELECT playlist_id, user_id, playlist_name FROM playlists WHERE playlist_id = ?',
    [playlistId]
  );
  return rows[0];
}

async function getPlaylistSongs(playlistId) {
  const [rows] = await db.query(
    `SELECT songs.song_id, songs.title AS song_title, artists.artist_name, songs.duration
     FROM playlist_songs
     INNER JOIN songs ON playlist_songs.song_id = songs.song_id
     INNER JOIN artists ON songs.artist_id = artists.artist_id
     WHERE playlist_songs.playlist_id = ?
     ORDER BY songs.title`,
    [playlistId]
  );
  return rows;
}

async function createPlaylist(userId, name) {
  const [result] = await db.query('INSERT INTO playlists (user_id, playlist_name) VALUES (?, ?)', [userId, name]);
  return result.insertId;
}

async function renamePlaylist(playlistId, name) {
  await db.query('UPDATE playlists SET playlist_name = ? WHERE playlist_id = ?', [name, playlistId]);
}

async function deletePlaylist(playlistId) {
  await db.query('DELETE FROM playlist_songs WHERE playlist_id = ?', [playlistId]);
  await db.query('DELETE FROM playlists WHERE playlist_id = ?', [playlistId]);
}

async function isSongInPlaylist(playlistId, songId) {
  const [rows] = await db.query(
    'SELECT song_id FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
    [playlistId, songId]
  );
  return rows.length > 0;
}

async function addSongToPlaylist(playlistId, songId) {
  await db.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)', [playlistId, songId]);
}

async function removeSongFromPlaylist(playlistId, songId) {
  await db.query('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?', [playlistId, songId]);
}

// FAVORITES, DOWNLOADS, QUEUE, HISTORY (each one is a list of songs per user

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
///////////////////////////////////////////////////////
async function deleteAlbum(albumId) {
  // delete the album's songs first, then delete the album
  const [songs] = await db.query('SELECT song_id FROM songs WHERE album_id = ?', [albumId]);
  for (let i = 0; i < songs.length; i++) {
    await deleteSong(songs[i].song_id);
  }
  await db.query('DELETE FROM albums WHERE album_id = ?', [albumId]);
}

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




