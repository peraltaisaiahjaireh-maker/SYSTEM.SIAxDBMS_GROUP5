// this file talks to the MySQL database. All SQL queries are here.
const db = require('../config/db');


//JHERALD SALVA

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

//GJ-CHYLL MORTE
//ARTISTS AND ALBUMS

async function getArtist() {
  const [rows] = await  db.query ('SELECT artist_id, artist_name FROM artists ORDER BY artist_name');
  return rows;
}

async function getArtist(artistId){
  const [rows] = await db.query ('SELECT artist_id, artist_name FROM artists WHERE artist_id = ?', [artistId]);
  return rows[0];
}

 async function createArtist(name) {
    const [result] = await db.query('INSERT INTO artists (artist_name) VALUES (?)', [name]);
    return result.insertId;
}

 async function deleteArtist(artistId) {
  // delete the artist's song first, then the albums, then the artist
  const [songs] = await db.query('SELECT song_id FROM songs WHERE artist_id = ?',[artistID]);
  for (let i = 0; i < songs.length; i++) {
      await deleteSong(songs[i].song_id);
  }
  await db.query ('DELETE FROM albums WHERE artist_id = ?', [artistId]);
  await db.query ('DELETE FROM artists WHERE artist_id = ?'.[artistId]);
 }

 async function getAlbums() {
    const [rows] = await db.query(`
        SELECT
            albums.album_id,
            albums.album_title,
            albums.artist_id,
            artists.artist_name
        FROM albums
        INNER JOIN artists
            ON albums.artist_id = artists.artist_id
        ORDER BY albums.album_title
    `);
    return rows;
}

async function getAlbum(albumId) {
  const [rows] = await db.query ('SELECT album_id, album_title, artist_id FROM albums WHERE album_id = ?', [albumId]);
  return rows [0];
}

async function  createAlbum(title, artistID) {
  const [result] = await db.query ('INSERT INTO albums (album_title, artist_id) VALUES (?,?)', [title, artistID]);
  return result.insertId;
  }


//JADGE ETHAN ROY SIENES
// SONGS AND GENRES

// JOIN 1 (INNER JOIN): songs together with their artist and album names
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
  // remove the song from every table that uses it, then delete the song
  const tables = ['playlist_songs', 'favorites', 'history', 'ratings', 'comments', 'queue', 'downloads', 'song_genres'];
  for (let i = 0; i < tables.length; i++) {
    await db.query('DELETE FROM ' + tables[i] + ' WHERE song_id = ?', [songId]);
  }
  await db.query('DELETE FROM songs WHERE song_id = ?', [songId]);
}


// ANTHONY SUPERIO
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


//ISAIAH JAIREH S. PERALTA

// RATINGS AND COMMENTS

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

// REPORTS (the three joins)

// JOIN 1: INNER JOIN. Songs with their artist and album names.
async function reportSongs() {
  const [rows] = await db.query(
    `SELECT songs.song_id, songs.title AS song_title, artists.artist_name, albums.album_title
     FROM songs
     INNER JOIN artists ON songs.artist_id = artists.artist_id
     INNER JOIN albums ON songs.album_id = albums.album_id`
  );
  return rows;
}

// JOIN 2: LEFT JOIN. All users and their playlists (users with 0 playlists are included).
async function reportUsersPlaylists() {
  const [rows] = await db.query(
    `SELECT users.username, playlists.playlist_name
     FROM users
     LEFT JOIN playlists ON users.user_id = playlists.user_id`
  );
  return rows;
}

// JOIN 3: FULL OUTER JOIN.
// LEFT JOIN and a RIGHT JOIN combined with UNION. This shows everything from both sides.
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

module.exports = {
  findUserByEmail, createUser, loginUser, getUser, getProfile, getSettings,
  createAlbum, deleteAlbum,
  updateUser, updateBio, updateTheme, deleteUser,
  getArtists, getArtist, createArtist, updateArtist, deleteArtist,
  getAlbums, getAlbum, createAlbum,
  getSongs, getSong, getGenres, getAllSongGenres, createSong, updateSong, setSongAudioPath, deleteSong,
  getPlaylists, getPlaylist, getPlaylistSongs, createPlaylist, renamePlaylist, deletePlaylist,
  isSongInPlaylist, addSongToPlaylist, removeSongFromPlaylist,
  getFavorites, isFavorite, addFavorite, removeFavorite,
  getDownloads, getDownload, isDownloaded, addDownload, removeDownload,
  getQueue, getQueueItem, addToQueue, removeFromQueue, clearQueue,
  getHistory, addHistory, clearHistory,
  getRatings, getRating, findRating, createRating, updateRating, deleteRating,
  getComments, getComment, createComment, updateComment, deleteComment,
  reportSongs, reportUsersPlaylists, reportUsersPlaylistsFull
};
