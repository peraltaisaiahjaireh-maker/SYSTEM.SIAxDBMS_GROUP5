// Harde Jeams Paligsa
function showLoginScreen(errorText) {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  stopSong();
  applyTheme('light');
  $('appScreen').classList.add('hidden');
  $('loginScreen').classList.remove('hidden');
  showRegister(false);
  $('loginError').textContent = errorText || '';
}

function forceLogout(text) {
  showLoginScreen(text);
}

function showRegister(show) {
  $('registerForm').classList.toggle('hidden', !show);
  $('loginForm').classList.toggle('hidden', show);
  $('loginError').textContent = '';
  $('registerError').textContent = '';
}

//Ang menu array
async function doLogin(event) {
  event.preventDefault();
  $('loginError').textContent = '';
  try {
    const data = await request('POST', '/login', {
      email: $('loginEmail').value,
      password: $('loginPassword').value
    });
    token = data.token;
    localStorage.setItem('token', token);
    $('loginPassword').value = '';
    await startApp();
  } catch (err) {
    $('loginError').textContent = err.message;
  }
}

// where you open/ refresh the page and open a song
async function doRegister(event) {
  event.preventDefault();
  $('registerError').textContent = '';
  try {
    await request('POST', '/users', {
      username: $('regUsername').value,
      email: $('regEmail').value,
      password: $('regPassword').value
    });
    const email = $('regEmail').value;
    $('registerForm').reset();
    showRegister(false);
    $('loginEmail').value = email;
    $('loginError').textContent = 'Account created. Please log in.';
  } catch (err) {
    $('registerError').textContent = err.message;
  }
}

async function doLogout() {
  try {
    await request('POST', '/logout');
  } catch (err) { }
  showLoginScreen('');
}

async function startApp() {
  currentUser = await request('GET', '/users/me');
  applyTheme(currentUser.theme);
  $('loginScreen').classList.add('hidden');
  $('appScreen').classList.remove('hidden');
  $('userInfo').textContent = 'Logged in as ' + currentUser.username;
  buildMenu();
  await showPage('songs');
}

//the menu array
async function loadProfile() {
  currentUser = await request('GET', '/users/me');
  let html = '<h2>Profile</h2>';
  html += '<div class="box"><h3>Your details</h3><form onsubmit="saveProfile(event)">';
  html += '<label>Username <input type="text" name="username" required maxlength="100" value="' + esc(currentUser.username) + '"></label>';
  html += '<label>Email <input type="email" name="email" required maxlength="100" value="' + esc(currentUser.email) + '"></label>';
  html += '<label>Bio <textarea name="bio" maxlength="500">' + esc(currentUser.bio) + '</textarea></label>';
  html += '<button type="submit" class="primary">Save profile</button></form></div>';

  html += '<div class="box"><h3>Settings</h3><form onsubmit="saveTheme(event)">';
  html += '<label>Theme <select name="theme">';
  html += '<option value="dark"' + (currentUser.theme === 'dark' ? ' selected' : '') + '>Dark</option>';
  html += '<option value="light"' + (currentUser.theme === 'light' ? ' selected' : '') + '>Light</option>';
  html += '</select></label>';
  html += '<button type="submit" class="primary">Save settings</button></form></div>';

  html += '<div class="box"><h3>Delete account</h3>';
  html += '<p class="muted">This permanently deletes your account, playlists, favorites and everything else that belongs to you.</p>';
  html += makeButton('Delete my account', 'deleteAccount()', 'danger') + '</div>';
  return html;
}
//////////////////////////////////////////////////////////////////////////////////
function saveProfile(event) {
  event.preventDefault();
  const form = event.target;
  runAction(async function () {
    currentUser = await request('PUT', '/users/me', {
      username: form.elements.username.value,
      email: form.elements.email.value,
      bio: form.elements.bio.value
    });
    $('userInfo').textContent = 'Logged in as ' + currentUser.username;
  }, 'Profile saved');
}

function saveTheme(event) {
  event.preventDefault();
  const theme = event.target.elements.theme.value;
  runAction(async function () {
    currentUser = await request('PUT', '/settings', { theme: theme });
    applyTheme(currentUser.theme);
  }, 'Settings saved');
}

function deleteAccount() {
  if (!confirm('Delete your account permanently? This cannot be undone.')) {
    return;
  }
  runAction(function () { return request('DELETE', '/users/me'); }, null, function () {
    showLoginScreen('Your account was deleted.');
  });
}