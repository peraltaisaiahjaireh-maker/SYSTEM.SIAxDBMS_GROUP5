// this file talks to the MySQL database. All SQL queries are here.
const db = require('../config/db');


/////////////////////////////////////////////////////////////////////////////////////////JHERALD

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
