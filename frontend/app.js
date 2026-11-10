const MENU = [
  ['songs', 'Songs'],
  ['artists', 'Artists and Albums'],
  ['playlists', 'Playlists'],
  ['favorites', 'Favorites'],
  ['queue', 'Queue'],
  ['history', 'History'],
  ['downloads', 'Downloads'],
  ['ratings', 'My Ratings'],
  ['reports', 'Reports'],
  ['profile', 'Profile']
];

function buildMenu() {
  let html = '';
  for (let i = 0; i < MENU.length; i++) {
    html += '<li><a href="#" id="menu-' + MENU[i][0] + '" onclick="showPage(\'' + MENU[i][0] + '\'); return false;">' + MENU[i][1] + '</a></li>';
  }
  $('menu').innerHTML = html;
}

//ISAIAH JAIREH S. PERALTA
//OBJECT OR SET OF ARRAY LOADERS
const LOADERS = {
  songs: loadSongs,
  song: loadSong,
  artists: loadArtists,
  playlists: loadPlaylists,
  playlist: loadPlaylist,
  favorites: loadFavorites,
  queue: loadQueue,
  history: loadHistory,
  downloads: loadDownloads,
  ratings: loadRatings,
  reports: loadReports,
  profile: loadProfile
};

// -showpage -refreshPage -openSong
async function showPage(page, arg) {
  currentPage = page;
  currentArg = arg === undefined ? null : arg;
  pageTurn++;
  const myTurn = pageTurn;

  let menuKey = page;
  if (page === 'song') { menuKey = 'songs'; }
  if (page === 'playlist') { menuKey = 'playlists'; }
  for (let i = 0; i < MENU.length; i++) {
    $('menu-' + MENU[i][0]).classList.toggle('active', MENU[i][0] === menuKey);
  }

  $('page').innerHTML = '<p class="muted">Loading...</p>';
  try {
    const html = await LOADERS[page](currentArg);
    if (myTurn === pageTurn) {
      $('page').innerHTML = html;
    }
  } catch (err) {
    if (myTurn === pageTurn) {
      $('page').innerHTML = '<p class="error-text">This page could not be loaded.</p>';
      showMessage(err.message, true);
    }
  }
}

function refreshPage() {
  return showPage(currentPage, currentArg);
}

function openSong(songId) {
  showPage('song', songId);
}

// -openForm -closeForm -readDuration
function openForm(title, fields, onSave) {
  let html = '<h3>' + esc(title) + '</h3>';
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const value = f.value === undefined || f.value === null ? '' : f.value;
    html += '<label>' + esc(f.label);
    if (f.type === 'select') {
      html += '<select name="' + f.name + '">';
      for (let j = 0; j < f.options.length; j++) {
        const selected = String(f.options[j].value) === String(value) ? ' selected' : '';
        html += '<option value="' + esc(f.options[j].value) + '"' + selected + '>' + esc(f.options[j].label) + '</option>';
      }
      html += '</select>';
    } else if (f.type === 'textarea') {
      html += '<textarea name="' + f.name + '" maxlength="' + (f.max || 500) + '">' + esc(value) + '</textarea>';
    } else if (f.type === 'file') {
      html += '<input type="file" name="' + f.name + '" accept="' + esc(f.accept || '') + '">';
    } else {
      html += '<input type="' + (f.type || 'text') + '" name="' + f.name + '" value="' + esc(value) + '"';
      if (f.type === 'number') {
        html += ' min="' + (f.min === undefined ? 0 : f.min) + '"';
        if (f.max !== undefined) { html += ' max="' + f.max + '"'; }
      } else {
        html += ' maxlength="' + (f.max || 100) + '"';
      }
      html += '>';
    }
    html += '</label>';
  }
  html += '<p class="error-text" id="dialogError"></p>';
  html += '<button type="submit" class="primary">Save</button> ';
  html += '<button type="button" onclick="closeForm()">Cancel</button>';

  const form = $('dialogForm');
  form.innerHTML = html;
  form.onsubmit = async function (event) {
    event.preventDefault();
    const values = {};
    for (let i = 0; i < fields.length; i++) {
      const input = form.elements[fields[i].name];
      values[fields[i].name] = fields[i].type === 'file' ? input.files[0] : input.value;
    }
    try {
      await onSave(values);
      closeForm();
    } catch (err) {
      $('dialogError').textContent = err.message;
    }
  };
  $('dialog').showModal();
}

function closeForm() {
  $('dialog').close();
}

function readDuration(minutes, seconds) {
  const m = minutes === '' ? 0 : Number(minutes);
  const s = seconds === '' ? 0 : Number(seconds);
  if (!Number.isInteger(m) || !Number.isInteger(s) || m < 0 || s < 0) {
    throw new Error('Length must be whole numbers');
  }
  if (s > 59) {
    throw new Error('Seconds must be 59 or less');
  }
  if (m * 60 + s < 1) {
    throw new Error('Length must be at least 1 second');
  }
  return m * 60 + s;
}

// KUNG ASA ANG PLAYER CONTROLS YOUTUBE SECTION NI
async function start() {
  if (!token) {
    showLoginScreen('');
    return;
  }
  try {
    await startApp();
  } catch (err) {
    showLoginScreen('Please log in again.');
  }
}

loadYouTubeAPI();
start();
