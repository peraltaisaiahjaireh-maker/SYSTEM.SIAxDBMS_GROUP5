// ISAIAH JAIREH S. PERALTA
// ARTISTS AND ALBUMS
const db = require('../config/db');
const songsModel = require('./songsModel');

async function getArtists() {
  const [rows] = await db.query('SELECT artist_id, artist_name FROM artists ORDER BY artist_name');
  return rows;
}

async function getArtist(artistId) {
  const [rows] = await db.query('SELECT artist_id, artist_name FROM artists WHERE artist_id = ?', [artistId]);
  return rows[0];
}

async function createArtist(name) {
  const [result] = await db.query('INSERT INTO artists (artist_name) VALUES (?)', [name]);
  return result.insertId;
}

async function updateArtist(artistId, name) {
  await db.query('UPDATE artists SET artist_name = ? WHERE artist_id = ?', [name, artistId]);
}

async function deleteArtist(artistId) {
  // delete the artist's songs first, then the albums, then the artist
  const [songs] = await db.query('SELECT song_id FROM songs WHERE artist_id = ?', [artistId]);
  for (let i = 0; i < songs.length; i++) {
    await songsModel.deleteSong(songs[i].song_id);
  }
  await db.query('DELETE FROM albums WHERE artist_id = ?', [artistId]);
  await db.query('DELETE FROM artists WHERE artist_id = ?', [artistId]);
}

async function getAlbums() {
  const [rows] = await db.query(
    `SELECT albums.album_id, albums.album_title, albums.artist_id, artists.artist_name
     FROM albums
     INNER JOIN artists ON albums.artist_id = artists.artist_id
     ORDER BY albums.album_title`
  );
  return rows;
}

async function getAlbum(albumId) {
  const [rows] = await db.query('SELECT album_id, album_title, artist_id FROM albums WHERE album_id = ?', [albumId]);
  return rows[0];
}

async function createAlbum(title, artistId) {
  const [result] = await db.query('INSERT INTO albums (album_title, artist_id) VALUES (?, ?)', [title, artistId]);
  return result.insertId;
}

async function deleteAlbum(albumId) {
  const [songs] = await db.query('SELECT song_id FROM songs WHERE album_id = ?', [albumId]);
  for (let i = 0; i < songs.length; i++) {
    await songsModel.deleteSong(songs[i].song_id);
  }
  await db.query('DELETE FROM albums WHERE album_id = ?', [albumId]);
}

module.exports = {
  getArtists, getArtist, createArtist, updateArtist, deleteArtist,
  getAlbums, getAlbum, createAlbum, deleteAlbum
};
