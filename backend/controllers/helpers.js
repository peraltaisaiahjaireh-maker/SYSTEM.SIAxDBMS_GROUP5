// shared helpers used by every controller file
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const songsModel = require('../models/songsModel');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.mp4'];

const sessions = {};

// RESPONSE 

function sendSuccess(res, status, message, data) {
  res.status(status).json({ success: true, message: message, data: data });
}

function sendError(res, status, message) {
  res.status(status).json({ success: false, message: message, data: null });
}

function makeError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

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

// INPUT CHECKING

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

function cleanNumber(value, name) {
  const number = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isInteger(number) || number < 1) {
    throw makeError(400, name + ' must be a whole number greater than 0');
  }
  return number;
}

function cleanOptionalNumber(value, name) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  return cleanNumber(value, name);
}

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

// SONG LOOKUP 

async function loadSong(songId) {
  const song = await songsModel.getSong(songId);
  if (!song) {
    throw makeError(404, 'Song not found');
  }
  return song;
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

module.exports = {
  crypto, fs, path, uploadsDir, AUDIO_EXTENSIONS, sessions,
  sendSuccess, sendError, makeError, handleError,
  cleanText, cleanNumber, cleanOptionalNumber, cleanScore, cleanEmail,
  extractYouTubeId, loadSong, removeStoredAudio, requireLogin
};
