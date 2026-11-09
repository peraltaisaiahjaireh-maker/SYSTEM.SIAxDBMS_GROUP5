// HARDE JEAMS PALIGSA
// ACCOUNT users, profile, settings
const db = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

async function findUserByEmail(email) {
  const [rows] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
  return rows[0];
}
//////////////////////////////////////////////////////////
async function createUser(username, email, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    const userId = result.insertId;
    await connection.query("INSERT INTO profile (user_id, bio) VALUES (?, '')", [userId]);
    await connection.query('INSERT INTO settings (user_id) VALUES (?)', [userId]);
    await connection.commit();
    return userId;
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Could not roll back account creation:', rollbackError);
    }
    throw err;
  } finally {
    connection.release();
  }
}

async function loginUser(email, password) {
  const [rows] = await db.query(
    'SELECT user_id, username, password FROM users WHERE email = ?',
    [email]
  );

  if (!rows[0]) return null;

  const storedPassword = rows[0].password;
  let match = false;
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);
  if (isBcryptHash) {
    match = await bcrypt.compare(password, storedPassword);
  } else if (/^[a-f\d]{64}$/i.test(storedPassword)) {
    const suppliedHash = crypto.createHash('sha256').update(password, 'utf8').digest();
    const storedHash = Buffer.from(storedPassword, 'hex');
    match = crypto.timingSafeEqual(suppliedHash, storedHash);
  } else {
    const suppliedPassword = Buffer.from(password, 'utf8');
    const legacyPassword = Buffer.from(storedPassword, 'utf8');
    match = suppliedPassword.length === legacyPassword.length &&
      crypto.timingSafeEqual(suppliedPassword, legacyPassword);
  }

  if (match && !isBcryptHash) {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password = ? WHERE user_id = ?', [passwordHash, rows[0].user_id]);
  }

  if (!match) return null;

  return {
    user_id: rows[0].user_id,
    username: rows[0].username
  };
}

///////////////////////////////////////////////////////

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

module.exports = {
  findUserByEmail, createUser, loginUser, getUser, getProfile, getSettings,
  updateUser, updateBio, updateTheme, deleteUser
};