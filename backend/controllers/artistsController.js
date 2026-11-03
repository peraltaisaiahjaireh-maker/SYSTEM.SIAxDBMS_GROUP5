// ISAIAH JAIREH S. PERALTA
// ARTISTS AND ALBUMS
const { sendSuccess, handleError, makeError, cleanText, cleanNumber, removeStoredAudio } = require('./helpers');
const model = require('../models/artistsModel');
const songsModel = require('../models/songsModel');

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
    const songs = (await songsModel.getSongs()).filter(function (song) {
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

async function deleteAlbum(req, res) {
  try {
    const albumId = cleanNumber(req.params.id, 'Album id');
    if (!(await model.getAlbum(albumId))) {
      throw makeError(404, 'Album not found');
    }
    const songs = (await songsModel.getSongs()).filter(function (song) {
      return Number(song.album_id) === albumId;
    });
    await model.deleteAlbum(albumId);
    songs.forEach(function (song) { removeStoredAudio(song.audio_path); });
    sendSuccess(res, 200, 'Album deleted', null);
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = {
  listArtists, getArtist, createArtist, updateArtist, deleteArtist,
  listAlbums, createAlbum, deleteAlbum
};
