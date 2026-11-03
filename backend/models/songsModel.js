// JHERALD SALVA
// SONGS AND GENRES
const db = require('../config/db');

// (INNER JOIN) songs together with their artist and album names
const SONG_QUERY = `
  SELECT songs.song_id, songs.title AS song_title, songs.artist_id, songs.album_id,
         artists.artist_name, albums.album_title, songs.duration, songs.youtube_id, songs.audio_path
  FROM songs
  INNER JOIN artists ON songs.artist_id = artists.artist_id
  INNER JOIN albums ON songs.album_id = albums.album_id`;

async function getSongs() {
  const [rows] = await db.query(SONG_QUERY + ' ORDER BY songs.title');
  return rows;
}

async function getSong(songId) {
  const [rows] = await db.query(SONG_QUERY + ' WHERE songs.song_id = ?', [songId]);
  return rows[0];
}

async function getGenres() {
  const [rows] = await db.query('SELECT genre_id, genre_name FROM genres ORDER BY genre_name');
  return rows;
}

// genre names of every song (the controller attaches them to the songs)
async function getAllSongGenres() {
  const [rows] = await db.query(
    `SELECT song_genres.song_id, genres.genre_id, genres.genre_name
     FROM song_genres
     INNER JOIN genres ON song_genres.genre_id = genres.genre_id`
  );
  return rows;
}

async function createSong(title, artistId, albumId, duration, genreId, youtubeId) {
  const [result] = await db.query(
    'INSERT INTO songs (title, artist_id, album_id, duration, youtube_id) VALUES (?, ?, ?, ?, ?)',
    [title, artistId, albumId, duration, youtubeId]
  );
  if (genreId) {
    await db.query('INSERT INTO song_genres (song_id, genre_id) VALUES (?, ?)', [result.insertId, genreId]);
  }
  return result.insertId;
}

async function updateSong(songId, title, artistId, albumId, duration, genreId, youtubeId) {
  await db.query(
    'UPDATE songs SET title = ?, artist_id = ?, album_id = ?, duration = ?, youtube_id = ? WHERE song_id = ?',
    [title, artistId, albumId, duration, youtubeId, songId]
  );
  await db.query('DELETE FROM song_genres WHERE song_id = ?', [songId]);
  if (genreId) {
    await db.query('INSERT INTO song_genres (song_id, genre_id) VALUES (?, ?)', [songId, genreId]);
  }
}

async function setSongAudioPath(songId, audioPath) {
  await db.query('UPDATE songs SET audio_path = ? WHERE song_id = ?', [audioPath, songId]);
}

async function deleteSong(songId) {
  // remove/delete the song
  const tables = ['playlist_songs', 'favorites', 'history', 'ratings', 'comments', 'queue', 'downloads', 'song_genres'];
  for (let i = 0; i < tables.length; i++) {
    await db.query('DELETE FROM ' + tables[i] + ' WHERE song_id = ?', [songId]);
  }
  await db.query('DELETE FROM songs WHERE song_id = ?', [songId]);
}

async function reportSongs() {
  const [rows] = await db.query(
    `SELECT songs.song_id, songs.title AS song_title, artists.artist_name, albums.album_title
     FROM songs
     INNER JOIN artists ON songs.artist_id = artists.artist_id
     INNER JOIN albums ON songs.album_id = albums.album_id`
  );
  return rows;
}

module.exports = {
  getSongs, getSong, getGenres, getAllSongGenres, createSong, updateSong, setSongAudioPath, deleteSong,
  reportSongs
};