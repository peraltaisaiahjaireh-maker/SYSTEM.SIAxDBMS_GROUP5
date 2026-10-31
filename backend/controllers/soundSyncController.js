//ISAIAH JAIREH S. PERALTA
// CONTROLLER: receives the request, checks the input, calls the model, sends the response.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const model = require('../models/soundSyncModel');
const uploadsDir = path.join(__dirname, '..', 'uploads');
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.mp4'];


const sessions = {};

// HELPERS 
function sendSuccess(res, status, message, data) {
  res.status(status).json({ success: true, message: message, data: data });
}

function sendError(res, status, message) {
  res.status(status).json({ success: false, message: message, data: null });
}

// HTTP status code
function makeError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// every controller function sends its errors here
function handleError(res, err) {
  if (err.status) {
    return sendError(res, err.status, err.message);
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return sendError(res, 400, 'One of the selected items does not exist');
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return sendError(res, 400, 'This item is still used by other records');
  }
  console.error(err);
  sendError(res, 500, 'Something went wrong on the server');
}

//input checking 

// required text with a maximum length
function cleanText(value, name, maxLength) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw makeError(400, name + ' is required');
  }
  const text = value.trim();
  if (text.length > maxLength) {
    throw makeError(400, name + ' must be ' + maxLength + ' characters or less');
  }
  return text;
}

// whole number that is 1 or more (used for ids, duration, ...)
function cleanNumber(value, name) {
  const number = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isInteger(number) || number < 1) {
    throw makeError(400, name + ' must be a whole number greater than 0');
  }
  return number;
}

// a number that may be left empty (returns null when empty)
function cleanOptionalNumber(value, name) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  return cleanNumber(value, name);
}

// rating score: 1 to 5
function cleanScore(value) {
  const score = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isInteger(score) || score < 1 || score > 5) {
    throw makeError(400, 'Rating must be a whole number from 1 to 5');
  }
  return score;
}

function cleanEmail(value) {
  const email = cleanText(value, 'Email', 100).toLowerCase();
  if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
    throw makeError(400, 'Email is not valid');
  }
  return email;
}
///////////////////////////////////////////////////////////
function extractYouTubeId(url) {
  if (typeof url !== 'string' || url.trim() === '') {
    return null;
  }
  const value = url.trim();
  if (/^[\w-]{11}$/.test(value)) {
    return value;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch (err) {
    throw makeError(400, 'Enter a valid YouTube link or 11-character video ID');
  }
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  let videoId = null;
  if (hostname === 'youtu.be') {
    videoId = parsed.pathname.split('/').filter(Boolean)[0];
  } else if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(hostname)) {
    if (parsed.pathname === '/watch') {
      videoId = parsed.searchParams.get('v');
    } else {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
        videoId = parts[1];
      }
    }
  }
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    throw makeError(400, 'Enter a valid YouTube link or 11-character video ID');
  }
  return videoId;
}

// ----- loading things that must exist -----

async function loadSong(songId) {
  const song = await model.getSong(songId);
  if (!song) {
    throw makeError(404, 'Song not found');
  }
  return song;
}

// the playlist must exist and belong to the logged-in user
async function loadMyPlaylist(req) {
  const playlistId = cleanNumber(req.params.id, 'Playlist id');
  const playlist = await model.getPlaylist(playlistId);
  if (!playlist) {
    throw makeError(404, 'Playlist not found');
  }
  if (playlist.user_id !== req.user.user_id) {
    throw makeError(403, 'This playlist belongs to another user');
  }
  return playlist;
}



////////////////////////////////////////////////////
// delete album
async function deleteAlbum(req, res) {
  try {
    const albumId = cleanNumber(req.params.id, 'Album id');
    if (!(await model.getAlbum(albumId))) {
      throw makeError(404, 'Album not found');
    }
    const songs = (await model.getSongs()).filter(function (song) {
      return Number(song.album_id) === albumId;
    });
    await model.deleteAlbum(albumId);
    songs.forEach(function (song) { removeStoredAudio(song.audio_path); });
    sendSuccess(res, 200, 'Album deleted', null);
  } catch (err) {
    handleError(res, err);
  }
}
// adds a "genres" list and a "genre_id" to each song
async function addGenresToSongs(songs) {
  const genreRows = await model.getAllSongGenres();
  for (let i = 0; i < songs.length; i++) {
    songs[i].genres = [];
    songs[i].genre_id = null;
    for (let j = 0; j < genreRows.length; j++) {
      if (genreRows[j].song_id === songs[i].song_id) {
        songs[i].genres.push(genreRows[j].genre_name);
        if (songs[i].genre_id === null) {
          songs[i].genre_id = genreRows[j].genre_id;
        }
      }
    }
  }
  return songs;
}

// reads and checks the song fields from the request body
async function readSongBody(body) {
  const song = {
    title: cleanText(body.title, 'Title', 100),
    artistId: cleanNumber(body.artist_id, 'Artist'),
    albumId: cleanNumber(body.album_id, 'Album'),
    duration: cleanNumber(body.duration, 'Length (seconds)'),
    genreId: cleanOptionalNumber(body.genre_id, 'Genre'),
    youtubeId: extractYouTubeId(body.youtube_id)
  };
  if (song.duration > 36000) {
    throw makeError(400, 'Length is too long');
  }
  const album = await model.getAlbum(song.albumId);
  if (!album) {
    throw makeError(400, 'That album does not exist');
  }
  if (album.artist_id !== song.artistId) {
    throw makeError(400, 'That album belongs to a different artist');
  }
  return song;
}

// LOGIN CHECK 

function requireLogin(req, res, next) {
  const token = req.headers.authorization;
  if (!token || !sessions[token]) {
    return sendError(res, 401, 'Please log in first');
  }
  req.token = token;
  req.user = sessions[token];
  next();
}

// ACCOUNT: users, profile, settings

async function loadMe(userId) {
  const user = await model.getUser(userId);
  if (!user) {
    throw makeError(404, 'User not found');
  }
  const profile = await model.getProfile(userId);
  const settings = await model.getSettings(userId);
  return {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    bio: profile ? profile.bio : '',
    theme: settings ? settings.theme : 'dark'
  };
}

async function register(req, res) {
  try {
    const username = cleanText(req.body.username, 'Username', 100);
    const email = cleanEmail(req.body.email);
    const password = req.body.password;
    if (typeof password !== 'string' || password.length < 6 || password.length > 100) {
      throw makeError(400, 'Password must be 6 to 100 characters');
    }
    if (await model.findUserByEmail(email)) {
      throw makeError(400, 'That email is already registered');
    }
    const userId = await model.createUser(username, email, password);
    sendSuccess(res, 201, 'Account created. You can log in now.', { user_id: userId });
  } catch (err) {
    handleError(res, err);
  }
}

async function login(req, res) {
  try {
    const email = cleanEmail(req.body.email);
    const password = req.body.password;
    if (typeof password !== 'string' || password === '') {
      throw makeError(400, 'Password is required');
    }
    const user = await model.loginUser(email, password);
    if (!user) {
      throw makeError(401, 'Wrong email or password');
    }
    const token = crypto.randomBytes(16).toString('hex');
    sessions[token] = { user_id: user.user_id, username: user.username };
    sendSuccess(res, 200, 'Logged in', { token: token, user_id: user.user_id, username: user.username });
  } catch (err) {
    handleError(res, err);
  }
}

async function logout(req, res) {
  delete sessions[req.token];
  sendSuccess(res, 200, 'Logged out', null);
}

async function getMe(req, res) {
  try {
    sendSuccess(res, 200, 'Profile loaded', await loadMe(req.user.user_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function updateMe(req, res) {
  try {
    const username = cleanText(req.body.username, 'Username', 100);
    const email = cleanEmail(req.body.email);
    let bio = req.body.bio;
    if (bio === undefined || bio === null) {
      bio = '';
    }
    if (typeof bio !== 'string' || bio.length > 500) {
      throw makeError(400, 'Bio must be 500 characters or less');
    }
    const other = await model.findUserByEmail(email);
    if (other && other.user_id !== req.user.user_id) {
      throw makeError(400, 'That email is already used by another account');
    }
    await model.updateUser(req.user.user_id, username, email);
    await model.updateBio(req.user.user_id, bio.trim());
    req.user.username = username;
    sendSuccess(res, 200, 'Profile saved', await loadMe(req.user.user_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function updateSettings(req, res) {
  try {
    const theme = req.body.theme;
    if (theme !== 'dark' && theme !== 'light') {
      throw makeError(400, 'Theme must be dark or light');
    }
    await model.updateTheme(req.user.user_id, theme);
    sendSuccess(res, 200, 'Settings saved', await loadMe(req.user.user_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function deleteMe(req, res) {
  try {
    await model.deleteUser(req.user.user_id);
    // log the user out everywhere
    for (const token in sessions) {
      if (sessions[token].user_id === req.user.user_id) {
        delete sessions[token];
      }
    }
    sendSuccess(res, 200, 'Account deleted', null);
  } catch (err) {
    handleError(res, err);
  }
}


// JHERALD SALVA

// ARTISTS AND ALBUMS

async function listArtists(req, res) {
  try {
    sendSuccess(res, 200, 'Artists loaded', await model.getArtists());
  } catch (err) {
    handleError(res, err);
  }
}

async function getArtist(req, res) {
  try {
    const artist = await model.getArtist(cleanNumber(req.params.id, 'Artist id'));
    if (!artist) {
      throw makeError(404, 'Artist not found');
    }
    sendSuccess(res, 200, 'Artist loaded', artist);
  } catch (err) {
    handleError(res, err);
  }
}

async function createArtist(req, res) {
  try {
    const name = cleanText(req.body.artist_name, 'Artist name', 100);
    const artistId = await model.createArtist(name);
    sendSuccess(res, 201, 'Artist added', await model.getArtist(artistId));
  } catch (err) {
    handleError(res, err);
  }
}

async function updateArtist(req, res) {
  try {
    const artistId = cleanNumber(req.params.id, 'Artist id');
    const name = cleanText(req.body.artist_name, 'Artist name', 100);
    if (!(await model.getArtist(artistId))) {
      throw makeError(404, 'Artist not found');
    }
    await model.updateArtist(artistId, name);
    sendSuccess(res, 200, 'Artist updated', await model.getArtist(artistId));
  } catch (err) {
    handleError(res, err);
  }
}

async function deleteArtist(req, res) {
  try {
    const artistId = cleanNumber(req.params.id, 'Artist id');
    if (!(await model.getArtist(artistId))) {
      throw makeError(404, 'Artist not found');
    }
    const songs = (await model.getSongs()).filter(function (song) {
      return Number(song.artist_id) === artistId;
    });
    await model.deleteArtist(artistId);
    songs.forEach(function (song) { removeStoredAudio(song.audio_path); });
    sendSuccess(res, 200, 'Artist deleted', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function listAlbums(req, res) {
  try {
    sendSuccess(res, 200, 'Albums loaded', await model.getAlbums());
  } catch (err) {
    handleError(res, err);
  }
}

async function createAlbum(req, res) {
  try {
    const title = cleanText(req.body.album_title, 'Album title', 100);
    const artistId = cleanNumber(req.body.artist_id, 'Artist');
    if (!(await model.getArtist(artistId))) {
      throw makeError(400, 'That artist does not exist');
    }
    const albumId = await model.createAlbum(title, artistId);
    sendSuccess(res, 201, 'Album added', await model.getAlbum(albumId));
  } catch (err) {
    handleError(res, err);
  }
}

// SONGS AND GENRES

async function listSongs(req, res) {
  try {
    const songs = await addGenresToSongs(await model.getSongs());
    sendSuccess(res, 200, 'Songs loaded', songs);
  } catch (err) {
    handleError(res, err);
  }
}

async function getSong(req, res) {
  try {
    const song = await loadSong(cleanNumber(req.params.id, 'Song id'));
    const songs = await addGenresToSongs([song]);
    sendSuccess(res, 200, 'Song loaded', songs[0]);
  } catch (err) {
    handleError(res, err);
  }
}

async function listGenres(req, res) {
  try {
    sendSuccess(res, 200, 'Genres loaded', await model.getGenres());
  } catch (err) {
    handleError(res, err);
  }
}

async function createSong(req, res) {
  try {
    const song = await readSongBody(req.body);
    const songId = await model.createSong(song.title, song.artistId, song.albumId, song.duration, song.genreId, song.youtubeId);
    const created = await addGenresToSongs([await model.getSong(songId)]);
    sendSuccess(res, 201, 'Song added', created[0]);
  } catch (err) {
    handleError(res, err);
  }
}

async function uploadSongAudio(req, res) {
  let uploadedPath = null;
  try {
    const songId = cleanNumber(req.params.id, 'Song id');
    const song = await loadSong(songId);
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw makeError(400, 'Choose an audio file to upload');
    }

    let filename;
    try {
      filename = decodeURIComponent(req.headers['x-audio-filename'] || '');
    } catch (err) {
      throw makeError(400, 'The audio filename is invalid');
    }
    const extension = path.extname(filename).toLowerCase();
    if (!AUDIO_EXTENSIONS.includes(extension)) {
      throw makeError(400, 'Choose an MP3, M4A, AAC, OGG, WAV, FLAC, or MP4 audio file');
    }
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('audio/') && contentType !== 'application/octet-stream' &&
      !(contentType === 'video/mp4' && extension === '.mp4')) {
      throw makeError(400, 'The uploaded file is not a supported audio type');
    }

    const storedName = crypto.randomBytes(16).toString('hex') + extension;
    uploadedPath = path.join(uploadsDir, storedName);
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    await fs.promises.writeFile(uploadedPath, req.body, { flag: 'wx' });
    const audioPath = '/media/' + storedName;
    await model.setSongAudioPath(songId, audioPath);
    removeStoredAudio(song.audio_path);
    sendSuccess(res, 200, 'Audio uploaded', { audio_path: audioPath });
  } catch (err) {
    if (uploadedPath) {
      await fs.promises.unlink(uploadedPath).catch(function (unlinkError) {
        if (unlinkError.code !== 'ENOENT') {
          console.error('Could not remove incomplete audio upload:', unlinkError);
        }
      });
    }
    handleError(res, err);
  }
}

function removeStoredAudio(audioPath) {
  if (!audioPath) {
    return;
  }
  const filename = path.basename(audioPath);
  fs.promises.unlink(path.join(uploadsDir, filename)).catch(function (err) {
    if (err.code !== 'ENOENT') {
      console.error('Could not remove stored audio file:', err);
    }
  });
}

async function streamSongAudio(req, res) {
  try {
    const songId = cleanNumber(req.params.id, 'Song id');
    const song = await loadSong(songId);
    if (!song.audio_path) {
      throw makeError(404, 'This song has no uploaded audio file');
    }
    const filename = path.basename(song.audio_path);
    res.sendFile(filename, { root: uploadsDir }, function (err) {
      if (err && !res.headersSent) {
        handleError(res, err);
      }
    });
  } catch (err) {
    handleError(res, err);
  }
}

async function updateSong(req, res) {
  try {
    const songId = cleanNumber(req.params.id, 'Song id');
    const existing = await loadSong(songId);
    const song = await readSongBody(req.body);
    await model.updateSong(songId, song.title, song.artistId, song.albumId, song.duration, song.genreId, song.youtubeId);
    if (song.youtubeId && existing.audio_path) {
      await model.setSongAudioPath(songId, null);
      removeStoredAudio(existing.audio_path);
    }
    const updated = await addGenresToSongs([await model.getSong(songId)]);
    sendSuccess(res, 200, 'Song updated', updated[0]);
  } catch (err) {
    handleError(res, err);
  }
}

async function deleteSong(req, res) {
  try {
    const songId = cleanNumber(req.params.id, 'Song id');
    const song = await loadSong(songId);
    await model.deleteSong(songId);
    removeStoredAudio(song.audio_path);
    sendSuccess(res, 200, 'Song deleted', null);
  } catch (err) {
    handleError(res, err);
  }
}

//ANTHONY SUPERIO
// PLAYLISTS

async function listPlaylists(req, res) {
  try {
    sendSuccess(res, 200, 'Playlists loaded', await model.getPlaylists(req.user.user_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function getPlaylist(req, res) {
  try {
    const playlist = await loadMyPlaylist(req);
    playlist.songs = await model.getPlaylistSongs(playlist.playlist_id);
    sendSuccess(res, 200, 'Playlist loaded', playlist);
  } catch (err) {
    handleError(res, err);
  }
}

async function createPlaylist(req, res) {
  try {
    const name = cleanText(req.body.playlist_name, 'Playlist name', 100);
    const playlistId = await model.createPlaylist(req.user.user_id, name);
    sendSuccess(res, 201, 'Playlist created', await model.getPlaylist(playlistId));
  } catch (err) {
    handleError(res, err);
  }
}

async function renamePlaylist(req, res) {
  try {
    const playlist = await loadMyPlaylist(req);
    const name = cleanText(req.body.playlist_name, 'Playlist name', 100);
    await model.renamePlaylist(playlist.playlist_id, name);
    sendSuccess(res, 200, 'Playlist renamed', await model.getPlaylist(playlist.playlist_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function deletePlaylist(req, res) {
  try {
    const playlist = await loadMyPlaylist(req);
    await model.deletePlaylist(playlist.playlist_id);
    sendSuccess(res, 200, 'Playlist deleted', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function addSongToPlaylist(req, res) {
  try {
    const playlist = await loadMyPlaylist(req);
    const songId = cleanNumber(req.body.song_id, 'Song');
    await loadSong(songId);
    if (await model.isSongInPlaylist(playlist.playlist_id, songId)) {
      throw makeError(400, 'That song is already in this playlist');
    }
    await model.addSongToPlaylist(playlist.playlist_id, songId);
    sendSuccess(res, 201, 'Song added to playlist', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function removeSongFromPlaylist(req, res) {
  try {
    const playlist = await loadMyPlaylist(req);
    const songId = cleanNumber(req.params.songId, 'Song id');
    if (!(await model.isSongInPlaylist(playlist.playlist_id, songId))) {
      throw makeError(404, 'That song is not in this playlist');
    }
    await model.removeSongFromPlaylist(playlist.playlist_id, songId);
    sendSuccess(res, 200, 'Song removed from playlist', null);
  } catch (err) {
    handleError(res, err);
  }
}

// FAVORITES, DOWNLOADS

async function listFavorites(req, res) {
  try {
    sendSuccess(res, 200, 'Favorites loaded', await model.getFavorites(req.user.user_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function addFavorite(req, res) {
  try {
    const songId = cleanNumber(req.body.song_id, 'Song');
    await loadSong(songId);
    if (await model.isFavorite(req.user.user_id, songId)) {
      throw makeError(400, 'That song is already in your favorites');
    }
    await model.addFavorite(req.user.user_id, songId);
    sendSuccess(res, 201, 'Added to favorites', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function removeFavorite(req, res) {
  try {
    const songId = cleanNumber(req.params.songId, 'Song id');
    if (!(await model.isFavorite(req.user.user_id, songId))) {
      throw makeError(404, 'That song is not in your favorites');
    }
    await model.removeFavorite(req.user.user_id, songId);
    sendSuccess(res, 200, 'Removed from favorites', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function listDownloads(req, res) {
  try {
    sendSuccess(res, 200, 'Downloads loaded', await model.getDownloads(req.user.user_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function addDownload(req, res) {
  try {
    const songId = cleanNumber(req.body.song_id, 'Song');
    await loadSong(songId);
    if (await model.isDownloaded(req.user.user_id, songId)) {
      throw makeError(400, 'That song is already downloaded');
    }
    await model.addDownload(req.user.user_id, songId);
    sendSuccess(res, 201, 'Song downloaded', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function removeDownload(req, res) {
  try {
    const download = await model.getDownload(cleanNumber(req.params.id, 'Download id'));
    if (!download) {
      throw makeError(404, 'Download not found');
    }
    if (download.user_id !== req.user.user_id) {
      throw makeError(403, 'This download belongs to another user');
    }
    await model.removeDownload(download.download_id);
    sendSuccess(res, 200, 'Download removed', null);
  } catch (err) {
    handleError(res, err);
  }
}

// QUEUE AND HISTORY

async function listQueue(req, res) {
  try {
    sendSuccess(res, 200, 'Queue loaded', await model.getQueue(req.user.user_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function addToQueue(req, res) {
  try {
    const songId = cleanNumber(req.body.song_id, 'Song');
    await loadSong(songId);
    await model.addToQueue(req.user.user_id, songId);
    sendSuccess(res, 201, 'Added to queue', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function removeFromQueue(req, res) {
  try {
    const item = await model.getQueueItem(cleanNumber(req.params.id, 'Queue id'));
    if (!item) {
      throw makeError(404, 'Queue item not found');
    }
    if (item.user_id !== req.user.user_id) {
      throw makeError(403, 'This queue item belongs to another user');
    }
    await model.removeFromQueue(item.queue_id);
    sendSuccess(res, 200, 'Removed from queue', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function clearQueue(req, res) {
  try {
    await model.clearQueue(req.user.user_id);
    sendSuccess(res, 200, 'Queue cleared', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function listHistory(req, res) {
  try {
    sendSuccess(res, 200, 'History loaded', await model.getHistory(req.user.user_id));
  } catch (err) {
    handleError(res, err);
  }
}

async function addHistory(req, res) {
  try {
    const songId = cleanNumber(req.body.song_id, 'Song');
    await loadSong(songId);
    await model.addHistory(req.user.user_id, songId);
    sendSuccess(res, 201, 'Saved to history', null);
  } catch (err) {
    handleError(res, err);
  }
}

async function clearHistory(req, res) {
  try {
    await model.clearHistory(req.user.user_id);
    sendSuccess(res, 200, 'History cleared', null);
  } catch (err) {
    handleError(res, err);
  }
}

//JADGE ETHAN ROY SIENES

// RATINGS AND COMMENTS

async function listRatings(req, res) {
  try {
    sendSuccess(res, 200, 'Ratings loaded', await model.getRatings(req.user.user_id));
  } catch (err) {
    handleError(res, err);
  }
}

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

//GJ-CHYLL MORTE
// REPORTS (the three joins)

async function reportSongs(req, res) {
  try {
    sendSuccess(res, 200, 'Report loaded', await model.reportSongs());
  } catch (err) {
    handleError(res, err);
  }
}

async function reportUsersPlaylists(req, res) {
  try {
    sendSuccess(res, 200, 'Report loaded', await model.reportUsersPlaylists());
  } catch (err) {
    handleError(res, err);
  }
}

async function reportUsersPlaylistsFull(req, res) {
  try {
    sendSuccess(res, 200, 'Report loaded', await model.reportUsersPlaylistsFull());
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = {
  requireLogin, handleError, sendError,
  createAlbum, deleteAlbum,
  register, login, logout, getMe, updateMe, updateSettings, deleteMe,
  listArtists, getArtist, createArtist, updateArtist, deleteArtist, listAlbums, createAlbum,
  listSongs, getSong, listGenres, createSong, uploadSongAudio, streamSongAudio, updateSong, deleteSong,
  listPlaylists, getPlaylist, createPlaylist, renamePlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist,
  listFavorites, addFavorite, removeFavorite, listDownloads, addDownload, removeDownload,
  listQueue, addToQueue, removeFromQueue, clearQueue, listHistory, addHistory, clearHistory,
  listRatings, createRating, updateRating, deleteRating,
  listComments, createComment, updateComment, deleteComment,
  reportSongs, reportUsersPlaylists, reportUsersPlaylistsFull
};
