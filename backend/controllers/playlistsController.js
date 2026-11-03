// ANTHONY SUPERIO
// PLAYLISTS
const { sendSuccess, handleError, makeError, cleanText, cleanNumber, loadSong } = require('./helpers');
const model = require('../models/playlistsModel');

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
  listPlaylists, getPlaylist, createPlaylist, renamePlaylist, deletePlaylist,
  addSongToPlaylist, removeSongFromPlaylist, reportUsersPlaylists, reportUsersPlaylistsFull
};