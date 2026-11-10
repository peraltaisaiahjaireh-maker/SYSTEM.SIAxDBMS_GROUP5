// JHERALD SALVA
// SONGS AND GENRES
const {
  crypto, fs, path, uploadsDir, AUDIO_EXTENSIONS,
  sendSuccess, sendError, handleError, makeError,
  cleanText, cleanNumber, cleanOptionalNumber, extractYouTubeId,
  loadSong, removeStoredAudio
} = require('./helpers');
const model = require('../models/songsModel');
const artistsModel = require('../models/artistsModel');

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
  const album = await artistsModel.getAlbum(song.albumId);
  if (!album) {
    throw makeError(400, 'That album does not exist');
  }
  if (album.artist_id !== song.artistId) {
    throw makeError(400, 'That album belongs to a different artist');
  }
  return song;
}

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

async function streamSongAudio(req, res) {
  try {
    const songId = cleanNumber(req.params.id, 'Song id');
    const song = await loadSong(songId);
    if (!song.audio_path) {
      throw makeError(404, 'This song has no uploaded audio file');
    }
    const filename = path.basename(song.audio_path);
    
    const fullPath = path.join(uploadsDir, filename);
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
    } catch (err) {
      throw makeError(404, 'This audio file is missing from the server');
    }
    res.sendFile(filename, { root: uploadsDir }, function (err) {
      if (err && !res.headersSent) {
        if (err.code === 'ENOENT') {
          return sendError(res, 404, 'This audio file is missing from the server');
        }
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

async function reportSongs(req, res) {
  try {
    sendSuccess(res, 200, 'Report loaded', await model.reportSongs());
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = {
  listSongs, getSong, listGenres, createSong, uploadSongAudio, streamSongAudio,
  updateSong, deleteSong, reportSongs
};