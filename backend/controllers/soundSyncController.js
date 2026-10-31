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

// input checking 

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

// whole number that is 1 or more 
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

// loading things that must exist 

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

// LOGIN CHECK (used by routes that need a logged-in user)

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