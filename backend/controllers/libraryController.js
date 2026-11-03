// JADGE ETHAN ROY SIENES
// FAVORITES, DOWNLOADS, QUEUE, HISTORY
const { sendSuccess, handleError, makeError, cleanNumber, loadSong } = require('./helpers');
const model = require('../models/libraryModel');

// FAVORITES

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

// DOWNLOADS

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

// QUEUE

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

// HISTORY

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

module.exports = {
  listFavorites, addFavorite, removeFavorite,
  listDownloads, addDownload, removeDownload,
  listQueue, addToQueue, removeFromQueue, clearQueue,
  listHistory, addHistory, clearHistory
};
