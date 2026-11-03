// ANTHONY SUPERIO
// PLAYLISTS
const db = require('../config/db');

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

// JOIN 2: LEFT JOIN
async function reportUsersPlaylists() {
  const [rows] = await db.query(
    `SELECT users.username, playlists.playlist_name
     FROM users
     LEFT JOIN playlists ON users.user_id = playlists.user_id`
  );
  return rows;
}

// JOIN 3: FULL OUTER JOIN 
async function reportUsersPlaylistsFull() {
  const [rows] = await db.query(
    `SELECT users.username, playlists.playlist_name
     FROM users
     LEFT JOIN playlists ON users.user_id = playlists.user_id

     UNION

     SELECT users.username, playlists.playlist_name
     FROM users
     RIGHT JOIN playlists ON users.user_id = playlists.user_id`
  );
  return rows;
}

module.exports ={
  getPlaylists, getPlaylist, getPlaylistSongs, createPlaylist, renamePlaylist, deletePlaylist,
  isSongInPlaylist, addSongToPlaylist, removeSongFromPlaylist,
  reportUsersPlaylists, reportUsersPlaylistsFull
};