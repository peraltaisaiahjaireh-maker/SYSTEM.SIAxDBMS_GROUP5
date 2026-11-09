// HARDE JEAMS PALIGSA
// ACCOUNT users, profile, settings
const { crypto, sendSuccess, sendError, handleError, makeError, cleanText, cleanEmail, sessions } = require('./helpers');
const model = require('../models/accountModel');

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
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
      user_id: user.user_id,
      username: user.username,
      expiresAt: Date.now() + 1000 * 60 * 60 * 8
    });

    sendSuccess(res, 200, 'Logged in', {
      token: token,
      user_id: user.user_id,
      username: user.username
    });
  } catch (err) {
    handleError(res, err);
  }
}

async function logout(req, res) {
  sessions.delete(req.token);
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
    for (const [token, session] of sessions) {
      if (session.user_id === req.user.user_id) {
        sessions.delete(token);
      }
    }
    sendSuccess(res, 200, 'Account deleted', null);
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = { register, login, logout, getMe, updateMe, updateSettings, deleteMe };