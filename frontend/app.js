// ISAIAH JAIREH S. PERALTA
//  CORE
// // talks to the REST API.
let token = localStorage.getItem('token');
let currentUser = null;
let currentPage = 'songs';
let currentArg = null;
let pageTurn = 0;
let loadingCount = 0;
let messageTimer = null;
let songCache = {};
let albumCache = {};
let commentCache = {};
let playingSong = null;
let playSeconds = 0;
let playTimer = null;
let ytPlayer = null;
let ytPlayerReady = false;
let ytApiFailed = false;
let localAudioUrl = null;
const localAudio = $('local-audio');
localAudio.volume = Number($('playerVolume').value) / 100;
let playbackList = [];
let isPlaying = false;
let playbackRequest = 0;
let pendingYouTubeSongId = null;
// HELPER FUNCTIONS
function $(id) {
  return document.getElementById(id);
}
// DROPDOWN PARA SA MENU
function makeSeeMoreMenu(items) {
  let html = '<div class="menu-dropdown">';
  html += '<button type="button" class="btn-see-more" onclick="toggleSeeMore(event)" title="More options" aria-label="More options" aria-haspopup="true" aria-expanded="false">⋮</button>';
  html += '<div class="dropdown-content hidden" role="menu">';
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    html += '<button type="button" role="menuitem" class="' + (item.extraClass || '') + '" onclick="closeAllMenus(); ' + item.action + '">' + item.label + '</button>';
  }
  html += '</div></div>';
  return html;
}

function toggleSeeMore(event) {
  event.stopPropagation();
  const button = event.currentTarget;
  const dropdown = button.nextElementSibling;
  const isHidden = dropdown.classList.contains('hidden');
  closeAllMenus();
  if (isHidden) {
    dropdown.classList.remove('hidden');
    dropdown.classList.add('is-open');
    button.parentElement.classList.add('menu-open');
    button.setAttribute('aria-expanded', 'true');

    const buttonRect = button.getBoundingClientRect();
    const menuRect = dropdown.getBoundingClientRect();
    const top = buttonRect.bottom + menuRect.height > window.innerHeight
      ? Math.max(8, buttonRect.top - menuRect.height)
      : buttonRect.bottom;
    const left = Math.max(8, Math.min(buttonRect.right - menuRect.width, window.innerWidth - menuRect.width - 8));
    dropdown.style.top = top + 'px';
    dropdown.style.left = left + 'px';
  }
}

function closeAllMenus() {
  const menus = document.querySelectorAll('.dropdown-content');
  menus.forEach(function (m) {
    m.classList.add('hidden');
    m.classList.remove('is-open');
    m.parentElement.classList.remove('menu-open');
    m.style.top = '';
    m.style.left = '';
    m.previousElementSibling.setAttribute('aria-expanded', 'false');
  });
}

document.addEventListener('click', closeAllMenus);
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeAllMenus();
  }
});
window.addEventListener('scroll', closeAllMenus, true);
window.addEventListener('resize', closeAllMenus);

// esc formatTime and make button
function esc(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

function makeButton(label, action, extraClass) {
  return '<button type="button" class="' + (extraClass || '') + '" onclick="' + action + '">' + label + '</button>';
}

const LIST_PAGE_SIZE = 10;

function makeTable(headers, rows, emptyText, tableId, pageSize) {
  if (rows.length === 0) {
    return '<p class="muted">' + esc(emptyText || 'Nothing here yet.') + '</p>';
  }
  const visibleRows = Math.min(rows.length, pageSize || LIST_PAGE_SIZE);
  const resolvedTableId = tableId || 'list-table-' + (++tableSequence);
  let html = '<div class="table-list"><div class="table-wrap"><table id="' + esc(resolvedTableId) +
    '" data-page-size="' + (pageSize || LIST_PAGE_SIZE) + '" data-visible-rows="' + visibleRows + '"><thead><tr>';
  for (let i = 0; i < headers.length; i++) {
    html += '<th>' + headers[i] + '</th>';
  }
  html += '</tr></thead><tbody>';
  for (let r = 0; r < rows.length; r++) {
    html += '<tr data-list-row data-row-index="' + r + '"' + (r >= visibleRows ? ' hidden' : '') + '>';
    for (let c = 0; c < rows[r].length; c++) {
      const isButtons = rows[r][c].indexOf('<button') === 0 || rows[r][c].indexOf('<div class="menu-dropdown">') === 0;
      html += '<td' + (isButtons ? ' class="buttons"' : '') + '>' + rows[r][c] + '</td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  if (rows.length > visibleRows) {
    html += '<button type="button" class="see-more-rows" aria-controls="' + esc(resolvedTableId) +
      '" aria-expanded="false" onclick="showMoreRows(this)"><span class="see-more-icon" aria-hidden="true">⌄</span>' +
      '<span class="see-more-label">See more</span><span class="see-more-count">Show ' + (rows.length - visibleRows) +
      ' more</span></button>';
  }
  return html + '</div>';
}

let tableSequence = 0;

function showMoreRows(button) {
  const table = button.parentElement.querySelector('table');
  const rows = table.querySelectorAll('[data-list-row]');
  const pageSize = Number(table.dataset.pageSize) || LIST_PAGE_SIZE;
  const totalRows = rows.length;
  let visibleRows = Number(table.dataset.visibleRows) || pageSize;
  const isExpanded = visibleRows >= totalRows;

  visibleRows = isExpanded ? Math.min(pageSize, totalRows) : Math.min(visibleRows + pageSize, totalRows);
  table.dataset.visibleRows = String(visibleRows);
  rows.forEach(function (row, index) {
    row.hidden = table.dataset.searchQuery
      ? row.textContent.toLowerCase().indexOf(table.dataset.searchQuery) === -1
      : index >= visibleRows;
  });

  const expanded = visibleRows >= totalRows;
  button.setAttribute('aria-expanded', String(expanded));
  button.querySelector('.see-more-label').textContent = expanded ? 'Show less' : 'See more';
  button.querySelector('.see-more-icon').textContent = expanded ? '⌃' : '⌄';
  button.querySelector('.see-more-count').textContent = expanded
    ? 'Showing all ' + totalRows
    : 'Show ' + (totalRows - visibleRows) + ' more';
}

// SONG LINK AND NONE TEXT and cacheSongs
function songLink(songId, title) {
  return '<a href="#" onclick="openSong(' + songId + '); return false;">' + esc(title) + '</a>';
}

function noneText(value, text) {
  return value === null || value === undefined ? '<span class="none">' + text + '</span>' : esc(value);
}

function cacheSongs(list) {
  for (let i = 0; i < list.length; i++) {
    songCache[list[i].song_id] = list[i];
  }
}

//where apply show message and clear message and apply the theme
function showMessage(text, isError) {
  const box = $('message');
  box.textContent = text;
  box.className = isError ? 'error' : '';
  clearTimeout(messageTimer);
  messageTimer = setTimeout(function () {
    box.className = 'hidden';
  }, 5000);
}

function clearMessage() {
  clearTimeout(messageTimer);
  $('message').textContent = '';
  $('message').className = 'hidden';
}

function applyTheme(theme) {
  document.body.className = theme === 'dark' ? 'dark' : '';
}


// YOUTUBE PLAYER
function onYouTubeIframeAPIReady() {
  if (ytPlayer || !window.YT || !window.YT.Player) {
    return;
  }
  ytPlayer = new YT.Player('yt-player-container', {
    height: '135',
    width: '240',
    playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, origin: window.location.origin },
    events: {
      onReady: function () {
        ytPlayerReady = true;
        ytPlayer.setVolume(Number($('playerVolume').value));
        $('playPauseButton').disabled = false;
        if (pendingYouTubeSongId !== null) {
          const songId = pendingYouTubeSongId;
          pendingYouTubeSongId = null;
          playSong(songId);
        }
      },
      onStateChange: onPlayerStateChange,
      onError: function (event) {
        if (!playingSong || playingSong.audio_path) {
          return;
        }
        isPlaying = false;
        clearInterval(playTimer);
        playTimer = null;
        updatePlayer();
        const messages = {
          2: 'The saved YouTube video ID is invalid. Edit the song and paste a full YouTube link or 11-character video ID.',
          5: 'YouTube could not decode this video in the browser. Try a different video.',
          100: 'This YouTube video was removed, made private, or the video ID is incorrect.',
          101: 'This YouTube video does not allow playback in embedded players. Try another video or upload the audio file.',
          150: 'This YouTube video does not allow playback in embedded players. Try another video or upload the audio file.',
          153: 'YouTube rejected the player origin. Reload SoundSync and try again.'
        };
        const message = messages[event.data] || 'This YouTube video could not be played (error ' + event.data + '). Check the source and try again.';
        showMessage(message, true);
      }
    }
  });
}

// YOUTUBE API LOADING
function loadYouTubeAPI() {
  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.async = true;
  script.onload = function () {
    waitForYouTubePlayerAPI(100);
  };
  script.onerror = function () {
    ytApiFailed = true;
  };
  document.head.appendChild(script);
}

function waitForYouTubePlayerAPI(attemptsLeft) {
  if (window.YT && window.YT.Player) {
    onYouTubeIframeAPIReady();
    return;
  }
  if (attemptsLeft > 0) {
    setTimeout(function () {
      waitForYouTubePlayerAPI(attemptsLeft - 1);
    }, 100);
  } else {
    ytApiFailed = true;
    showMessage('The YouTube player could not be initialized. Check your connection and reload the page.', true);
  }
}

function onPlayerStateChange(event) {
  if (!playingSong || playingSong.audio_path) {
    return;
  }
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    clearInterval(playTimer);
    playTimer = setInterval(updatePlayer, 500);
    clearMessage();
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.CUED) {
    isPlaying = false;
    clearInterval(playTimer);
    playTimer = null;
  } else if (event.data === YT.PlayerState.ENDED) {
    isPlaying = false;
    clearInterval(playTimer);
    playTimer = null;
    playNextSong();
  } else if (event.data === YT.PlayerState.BUFFERING) {
    isPlaying = false;
  }
  updatePlayer();
}

localAudio.addEventListener('play', function () {
  if (!playingSong || !playingSong.audio_path) {
    return;
  }
  isPlaying = true;
  clearInterval(playTimer);
  playTimer = setInterval(updatePlayer, 500);
  clearMessage();
  updatePlayer();
});
localAudio.addEventListener('pause', function () {
  if (!playingSong || !playingSong.audio_path || !localAudio.paused) {
    return;
  }
  isPlaying = false;
  clearInterval(playTimer);
  playTimer = null;
  updatePlayer();
});
localAudio.addEventListener('ended', function () {
  if (!playingSong || !playingSong.audio_path) {
    return;
  }
  isPlaying = false;
  playNextSong();
});
localAudio.addEventListener('error', function () {
  if (playingSong && playingSong.audio_path) {
    showMessage('This local audio file could not be played. Try another supported audio format.', true);
  }
});


// request
async function request(method, url, body) {
  loadingCount++;
  $('loading').classList.remove('hidden');
  try {
    const options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (token) {
      options.headers['Authorization'] = token;
    }
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch('/api' + url, options);
    let result;
    try {
      result = await response.json();
    } catch (e) {
      throw new Error('The server sent an unreadable answer');
    }
    if (!response.ok) {
      if (response.status === 401 && token) {
        forceLogout('Your session ended. Please log in again.');
      }
      throw new Error(result.message || 'Request failed');
    }
    return result.data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Cannot reach the server. Is it running?');
    }
    throw err;
  } finally {
    loadingCount--;
    if (loadingCount === 0) {
      $('loading').classList.add('hidden');
    }
  }
}

// where runAction
async function runAction(work, successText, after) {
  try {
    await work();
    if (successText) {
      showMessage(successText, false);
    }
    if (after) {
      await after();
    }
  } catch (err) {
    showMessage(err.message, true);
  }
}

// LOGIN AND REGISTER or login screen
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
async function playSong(songId) {
  const requestId = ++playbackRequest;
  pendingYouTubeSongId = null;
  let song = songCache[songId];
  if (!song) {
    showMessage('That song is not available. Refresh the page.', true);
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(song, 'youtube_id')) {
    try {
      song = await request('GET', '/songs/' + songId);
      if (requestId !== playbackRequest) { return; }
      cacheSongs([song]);
    } catch (err) {
      showMessage(err.message, true);
      return;
    }
  }

  if (!song.audio_path && !song.youtube_id) {
    showMessage('This song has no audio source yet. Edit it to add a YouTube link or upload an audio file.', true);
    return;
  }
  // YOUTUBE IDENTIFIER FOR DEVELOPERS CODE
  if (!song.audio_path && !/^[\w-]{11}$/.test(song.youtube_id)) {
    showMessage('This song has an invalid YouTube video ID. Edit the song and check its source.', true);
    return;
  }
  if (!song.audio_path && (!ytPlayer || !ytPlayerReady || !window.YT || !window.YT.Player)) {
    if (ytApiFailed) {
      showMessage('YouTube could not be reached. Check your internet connection and reload the page.', true);
    } else {
      pendingYouTubeSongId = songId;
      showMessage('The YouTube player is loading. This song will start as soon as it is ready.', false);
    }
    return;
  }

  clearInterval(playTimer);
  playTimer = null;
  localAudio.pause();
  localAudio.removeAttribute('src');
  localAudio.load();
  if (localAudioUrl) {
    URL.revokeObjectURL(localAudioUrl);
    localAudioUrl = null;
  }
  playingSong = song;
  playSeconds = 0;
  isPlaying = false;
  updatePlayer();
  if (song.audio_path) {
    if (ytPlayer && ytPlayerReady) {
      ytPlayer.stopVideo();
    }
    try {
      const response = await fetch('/api/songs/' + songId + '/audio', {
        headers: { Authorization: token }
      });
      if (requestId !== playbackRequest) { return; }
      if (!response.ok) {
        let result;
        try {
          result = await response.json();
        } catch (err) {
          throw new Error('The server sent an unreadable answer');
        }
        if (response.status === 401 && token) {
          forceLogout('Your session ended. Please log in again.');
        }
        throw new Error(result.message || 'Could not load the audio file');
      }
      const audioBlob = await response.blob();
      if (requestId !== playbackRequest) { return; }
      localAudioUrl = URL.createObjectURL(audioBlob);
      localAudio.src = localAudioUrl;
      try {
        await localAudio.play();
      } catch (err) {
        if (requestId === playbackRequest) {
          showMessage('Your browser blocked playback. Press Play to start the local track.', true);
        }
      }
    } catch (err) {
      if (requestId !== playbackRequest) { return; }
      showMessage(err instanceof TypeError ? 'Cannot reach the server. Is it running?' : err.message, true);
      return;
    }
  } else {
    if (ytPlayer && ytPlayerReady) {
      ytPlayer.loadVideoById(song.youtube_id);
    }
  }
  try {
    await request('POST', '/history', { song_id: songId });
    if (currentPage === 'history') {
      await refreshPage();
    }
  } catch (err) {
    showMessage(err.message, true);
  }
}

function updatePlayer() {
  if (!playingSong) {
    $('playerTitle').textContent = 'Nothing playing';
    $('playerArtist').textContent = 'Choose a song to get started';
    $('playerElapsed').textContent = '0:00';
    $('playerTime').textContent = formatTime(0);
    $('playerSeek').value = '0';
    $('playPauseButton').textContent = '▶';
    $('playPauseButton').setAttribute('aria-label', 'Play');
    $('playPauseButton').title = 'Play';
    return;
  }
  $('playerTitle').textContent = playingSong.song_title;
  $('playerArtist').textContent = playingSong.artist_name;
  const duration = playingSong.audio_path
    ? (localAudio.duration > 0 ? localAudio.duration : playingSong.duration)
    : (ytPlayer && ytPlayer.getDuration() > 0 ? ytPlayer.getDuration() : playingSong.duration);
  const currentTime = playingSong.audio_path
    ? localAudio.currentTime
    : (ytPlayer && ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : playSeconds);
  playSeconds = Math.floor(currentTime);
  $('playerElapsed').textContent = formatTime(playSeconds);
  $('playerTime').textContent = formatTime(Math.floor(duration));
  $('playerSeek').value = String(Math.round((currentTime / duration) * 1000) || 0);
  $('playPauseButton').textContent = isPlaying ? 'Ⅱ' : '▶';
  $('playPauseButton').setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  $('playPauseButton').title = isPlaying ? 'Pause' : 'Play';
}

function togglePlayback() {
  if (!playingSong) {
    if (playbackList.length > 0) {
      playSong(playbackList[0].song_id);
    } else {
      showMessage('Choose a song from your library first.', true);
    }
    return;
  }
  if (playingSong.audio_path) {
    if (isPlaying) {
      localAudio.pause();
    } else {
      localAudio.play().catch(function () {
        showMessage('This local audio file could not be played.', true);
      });
    }
  } else {
    if (!ytPlayer || !ytPlayerReady) {
      showMessage('The music player is still loading. Please try again in a moment.', true);
      return;
    }
    if (isPlaying) {
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
    }
  }
}

function seekSong(value) {
  if (playingSong && playingSong.audio_path && localAudio.duration > 0) {
    const position = Number(value) / 1000 * localAudio.duration;
    localAudio.currentTime = position;
    playSeconds = Math.floor(position);
    $('playerElapsed').textContent = formatTime(playSeconds);
  } else if (playingSong && ytPlayer && ytPlayer.getDuration() > 0) {
    const position = Number(value) / 1000 * ytPlayer.getDuration();
    ytPlayer.seekTo(position, true);
    playSeconds = Math.floor(position);
    $('playerElapsed').textContent = formatTime(playSeconds);
  }
}

// FUNCTION WERE ANG VOLUME MA CONTROL SULOD SYSTEM
function setPlayerVolume(value) {
  localAudio.volume = Number(value) / 100;
  if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
    ytPlayer.setVolume(Number(value));
  }
}

function playAdjacentSong(offset) {
  if (!playingSong || playbackList.length === 0) {
    showMessage('Choose a song from your library first.', true);
    return;
  }
  let index = playbackList.findIndex(function (song) {
    return Number(song.song_id) === Number(playingSong.song_id);
  });
  if (index < 0) {
    index = offset > 0 ? -1 : 0;
  }
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= playbackList.length) {
    if (offset > 0) {
      stopSong();
    }
    return;
  }
  playSong(playbackList[nextIndex].song_id);
}

// THE MAJOR FEATURE OF OUR SYSTEM
function startGenreHopMix() {
  const buckets = {};
  const untaggedKey = 'No genre';
  for (let i = 0; i < playbackList.length; i++) {
    const song = playbackList[i];
    if (!song.audio_path && !song.youtube_id) {
      continue;
    }
    const genre = song.genres && song.genres.length > 0 ? song.genres[0] : untaggedKey;
    if (!buckets[genre]) {
      buckets[genre] = [];
    }
    buckets[genre].push(song);
  }

  const genreNames = Object.keys(buckets);
  if (genreNames.length === 0) {
    showMessage('Add a YouTube link or local audio file to at least one song first.', true);
    return;
  }

  for (let i = 0; i < genreNames.length; i++) {
    const songs = buckets[genreNames[i]];
    for (let j = songs.length - 1; j > 0; j--) {
      const randomIndex = Math.floor(Math.random() * (j + 1));
      const current = songs[j];
      songs[j] = songs[randomIndex];
      songs[randomIndex] = current;
    }
  }
  for (let i = genreNames.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const current = genreNames[i];
    genreNames[i] = genreNames[randomIndex];
    genreNames[randomIndex] = current;
  }

  const mix = [];
  let hasSongs = true;
  while (hasSongs) {
    hasSongs = false;
    for (let i = 0; i < genreNames.length; i++) {
      const nextSong = buckets[genreNames[i]].pop();
      if (nextSong) {
        mix.push(nextSong);
        hasSongs = true;
      }
    }
  }

  playbackList = mix;
  showMessage('Genre-hop mix is ready: ' + mix.length + ' tracks across ' + genreNames.length + ' groups.', false);
  playSong(mix[0].song_id);
}

function playPreviousSong() {
  if (playingSong && playingSong.audio_path && localAudio.currentTime > 3) {
    localAudio.currentTime = 0;
    return;
  }
  if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getCurrentTime() > 3) {
    ytPlayer.seekTo(0, true);
    return;
  }
  playAdjacentSong(-1);
}

function playNextSong() {
  playAdjacentSong(1);
}

function stopSong() {
  playbackRequest++;
  pendingYouTubeSongId = null;
  localAudio.pause();
  localAudio.removeAttribute('src');
  localAudio.load();
  if (localAudioUrl) {
    URL.revokeObjectURL(localAudioUrl);
    localAudioUrl = null;
  }
  if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
    ytPlayer.stopVideo();
  }
  clearInterval(playTimer);
  playTimer = null;
  playingSong = null;
  playSeconds = 0;
  isPlaying = false;
  updatePlayer();
}

// JHERALD SALVA
// LOAD SONGS INTO THE LIBRARY
async function loadSongs() {
  const songs = await request('GET', '/songs');
  const albums = await request('GET', '/albums');
  const genres = await request('GET', '/genres');
  cacheSongs(songs);
  playbackList = songs;

  let rows = [];
  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    rows.push([
      songLink(s.song_id, s.song_title),
      esc(s.artist_name),
      esc(s.album_title),
      s.genres.length > 0 ? esc(s.genres.join(', ')) : '-',
      formatTime(s.duration),
      makeSeeMoreMenu([
        { label: 'Play', action: 'playSong(' + s.song_id + ')' },
        { label: 'Add to queue', action: 'addToQueue(' + s.song_id + ')' },
        { label: 'Add to playlist', action: 'addToPlaylist(' + s.song_id + ')' },
        { label: 'Download', action: 'downloadSong(' + s.song_id + ')' },
        { label: 'Edit', action: 'editSong(' + s.song_id + ')' },
        { label: 'Delete', action: 'deleteSong(' + s.song_id + ')', extraClass: 'danger' }
      ])
    ]);
  }

  let html = '<div class="library-heading"><div><span class="eyebrow">YOUR COLLECTION</span><h2>Music library</h2><p class="muted">' +
    songs.length + (songs.length === 1 ? ' song ready for your next listening session.' : ' songs ready for your next listening session.') +
    '</p></div><div class="library-actions">';
  if (songs.length > 0) {
    html += makeButton('Play all', 'playSong(' + songs[0].song_id + ')', 'primary');
    html += makeButton('Genre-hop mix', 'startGenreHopMix()');
  }
  html += '</div></div>';
  html += '<details class="box add-song-panel"><summary><span>Add a song or upload audio</span><span class="add-song-hint">YouTube link or local audio file</span></summary>';
  if (albums.length === 0) {
    html += '<p class="muted">Add an artist and an album first (Artists and Albums page).</p>';
  } else {
    html += '<form onsubmit="submitSong(event)">';
    html += '<div class="inline-fields">';
    html += '<label>Title <input type="text" name="title" required maxlength="100"></label>';
    html += '<label>Album <select name="album_id">' + albumOptions(albums, '') + '</select></label>';
    html += '<label>Genre <select name="genre_id">' + genreOptions(genres, '') + '</select></label>';
    html += '<label>Minutes <input type="number" name="minutes" min="0" value="3"></label>';
    html += '<label>Seconds <input type="number" name="seconds" min="0" max="59" value="0"></label>';
    html += '<label>YouTube link or video ID <input type="text" name="youtube_id" placeholder="https://www.youtube.com/watch?v=..."></label>';
    html += '<label>Or upload local music <input type="file" name="audio_file" accept="audio/*,video/mp4,.flac"></label>';
    html += '<p class="muted">Local files are stored with your library on this server (maximum 50 MB each).</p>';
    html += '<button type="submit" class="primary">Add song</button>';
    html += '</div></form>';
  }
  html += '</details>';
  html += '<label class="song-search"><span>Find something to play</span><input type="search" placeholder="Search songs, artists, albums or genres" oninput="filterSongs(this.value)"></label>';
  html += makeTable(['Title', 'Artist', 'Album', 'Genre', 'Length', ''], rows, 'There are no songs yet.', 'songTable');
  return html;
}

function filterSongs(query) {
  const table = $('songTable');
  if (!table) {
    return;
  }
  const search = query.trim().toLowerCase();
  table.dataset.searchQuery = search;
  const rows = table.querySelectorAll('[data-list-row]');
  const visibleRows = Number(table.dataset.visibleRows) || LIST_PAGE_SIZE;
  rows.forEach(function (row, index) {
    const matches = row.textContent.toLowerCase().indexOf(search) !== -1;
    row.hidden = search ? !matches : index >= visibleRows;
  });
  const moreButton = table.parentElement.parentElement.querySelector('.see-more-rows');
  if (moreButton) {
    moreButton.hidden = Boolean(search);
  }
}

function albumOptions(albums, selectedId) {
  let html = '';
  for (let i = 0; i < albums.length; i++) {
    albumCache[albums[i].album_id] = albums[i];
    const selected = String(albums[i].album_id) === String(selectedId) ? ' selected' : '';
    html += '<option value="' + albums[i].album_id + '"' + selected + '>' + esc(albums[i].album_title) + ' (' + esc(albums[i].artist_name) + ')</option>';
  }
  return html;
}

function genreOptions(genres, selectedId) {
  let html = '<option value="">No genre</option>';
  for (let i = 0; i < genres.length; i++) {
    const selected = String(genres[i].genre_id) === String(selectedId) ? ' selected' : '';
    html += '<option value="' + genres[i].genre_id + '"' + selected + '>' + esc(genres[i].genre_name) + '</option>';
  }
  return html;
}

function submitSong(event) {
  event.preventDefault();
  const form = event.target;
  runAction(async function () {
    const albumId = form.elements.album_id.value;
    const audioFile = form.elements.audio_file.files[0];
    const youtubeId = form.elements.youtube_id.value.trim();
    if (audioFile && youtubeId) {
      throw new Error('Choose either a YouTube link or a local audio file, not both.');
    }
    if (!audioFile && !youtubeId) {
      throw new Error('Add a YouTube link or choose a local audio file.');
    }
    const created = await request('POST', '/songs', {
      title: form.elements.title.value,
      artist_id: albumCache[albumId].artist_id,
      album_id: albumId,
      duration: readDuration(form.elements.minutes.value, form.elements.seconds.value),
      genre_id: form.elements.genre_id.value,
      youtube_id: youtubeId
    });
    if (audioFile) {
      try {
        await requestAudioUpload(created.song_id, audioFile);
      } catch (err) {
        try {
          await request('DELETE', '/songs/' + created.song_id);
        } catch (cleanupError) {
          throw new Error(err.message + ' The song entry could not be removed; delete it from the library.');
        }
        throw new Error('The local audio upload failed, so the song was not added. ' + err.message);
      }
    }
  }, 'Song added', refreshPage);
}

async function requestAudioUpload(songId, file) {
  loadingCount++;
  $('loading').classList.remove('hidden');
  try {
    const response = await fetch('/api/songs/' + songId + '/audio', {
      method: 'PUT',
      headers: {
        Authorization: token,
        'Content-Type': file.type || 'application/octet-stream',
        'X-Audio-Filename': encodeURIComponent(file.name)
      },
      body: file
    });
    let result;
    try {
      result = await response.json();
    } catch (err) {
      throw new Error('The server sent an unreadable answer');
    }
    if (!response.ok) {
      if (response.status === 401 && token) {
        forceLogout('Your session ended. Please log in again.');
      }
      throw new Error(result.message || 'Audio upload failed');
    }
    return result.data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Cannot reach the server. Is it running?');
    }
    throw err;
  } finally {
    loadingCount--;
    if (loadingCount === 0) {
      $('loading').classList.add('hidden');
    }
  }
}


async function loadSong(songId) {
  const song = await request('GET', '/songs/' + songId);
  const comments = await request('GET', '/songs/' + songId + '/comments');
  const ratings = await request('GET', '/ratings');
  const favorites = await request('GET', '/favorites');
  const downloads = await request('GET', '/downloads');
  cacheSongs([song]);

  let myRating = null;
  for (let i = 0; i < ratings.length; i++) {
    if (ratings[i].song_id === song.song_id) { myRating = ratings[i]; }
  }
  let isFavorite = false;
  for (let i = 0; i < favorites.length; i++) {
    if (favorites[i].song_id === song.song_id) { isFavorite = true; }
  }
  let isDownloaded = false;
  for (let i = 0; i < downloads.length; i++) {
    if (downloads[i].song_id === song.song_id) { isDownloaded = true; }
  }

  let html = '<p><a href="#" onclick="showPage(\'songs\'); return false;">Back to songs</a></p>';
  html += '<h2>' + esc(song.song_title) + '</h2>';
  html += '<p class="muted">' + esc(song.artist_name) + ' / ' + esc(song.album_title) + ' / ' +
    (song.genres.length > 0 ? esc(song.genres.join(', ')) : 'no genre') + ' / ' + formatTime(song.duration) + '</p>';

  html += '<p>';
  html += makeButton('Play', 'playSong(' + song.song_id + ')', 'primary');
  html += makeButton('Add to queue', 'addToQueue(' + song.song_id + ')');
  html += makeButton('Add to playlist', 'addToPlaylist(' + song.song_id + ')');
  html += isFavorite
    ? makeButton('Remove from favorites', 'removeFavorite(' + song.song_id + ')')
    : makeButton('Add to favorites', 'addFavorite(' + song.song_id + ')');
  html += isDownloaded
    ? '<button type="button" disabled>Downloaded</button>'
    : makeButton('Download', 'downloadSong(' + song.song_id + ')');
  html += makeButton('Edit', 'editSong(' + song.song_id + ')');
  html += makeButton('Delete', 'deleteSong(' + song.song_id + ')', 'danger');
  html += '</p>';

  html += '<div class="box"><h3>Your rating</h3>';
  if (myRating) {
    html += '<p>You rated this song ' + myRating.score + ' out of 5.</p>';
    html += makeButton('Change rating', 'changeRating(' + myRating.rating_id + ', ' + myRating.score + ')');
    html += makeButton('Remove rating', 'deleteRating(' + myRating.rating_id + ')', 'danger');
  } else {
    html += '<select id="ratingSelect"><option value="5">5 (best)</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select> ';
    html += makeButton('Save rating', 'rateSong(' + song.song_id + ')', 'primary');
  }
  html += '</div>';

  html += '<div class="box"><h3>Comments</h3>';
  if (comments.length === 0) {
    html += '<p class="muted">No comments yet.</p>';
  }
  for (let i = 0; i < comments.length; i++) {
    const c = comments[i];
    commentCache[c.comment_id] = c.comment_text;
    html += '<div class="comment"><b>' + esc(c.username) + '</b><br>' + esc(c.comment_text);
    if (c.user_id === currentUser.user_id) {
      html += '<br>' + makeButton('Edit', 'editComment(' + c.comment_id + ')') + makeButton('Delete', 'deleteComment(' + c.comment_id + ')', 'danger');
    }
    html += '</div>';
  }
  html += '<form onsubmit="submitComment(event, ' + song.song_id + ')">';
  html += '<label>Write a comment <textarea name="comment_text" maxlength="500" required></textarea></label>';
  html += '<button type="submit" class="primary">Post comment</button></form>';
  html += '</div>';
  return html;
}


// JADGE ETHAN ROY SIENES
function addToQueue(songId) {
  runAction(function () { return request('POST', '/queue', { song_id: songId }); }, 'Added to queue');
}

function addFavorite(songId) {
  runAction(function () { return request('POST', '/favorites', { song_id: songId }); }, 'Added to favorites', refreshPage);
}

function removeFavorite(songId) {
  runAction(function () { return request('DELETE', '/favorites/' + songId); }, 'Removed from favorites', refreshPage);
}

function downloadSong(songId) {
  runAction(function () { return request('POST', '/downloads', { song_id: songId }); }, 'Song downloaded', refreshPage);
}


// ANTHONY SUPERIO
async function addToPlaylist(songId) {
  try {
    const playlists = await request('GET', '/playlists');
    if (playlists.length === 0) {
      showMessage('You have no playlists yet. Create one on the Playlists page first.', true);
      return;
    }
    const options = [];
    for (let i = 0; i < playlists.length; i++) {
      options.push({ value: playlists[i].playlist_id, label: playlists[i].playlist_name });
    }
    openForm('Add to playlist', [{ name: 'playlist_id', label: 'Playlist', type: 'select', options: options }], async function (values) {
      await request('POST', '/playlists/' + values.playlist_id + '/songs', { song_id: songId });
      showMessage('Song added to playlist', false);
    });
  } catch (err) {
    showMessage(err.message, true);
  }
}

//JHERALD SALVA
async function editSong(songId) {
  try {
    const song = await request('GET', '/songs/' + songId);
    const albums = await request('GET', '/albums');
    const genres = await request('GET', '/genres');
    const albumList = [];
    for (let i = 0; i < albums.length; i++) {
      albumCache[albums[i].album_id] = albums[i];
      albumList.push({ value: albums[i].album_id, label: albums[i].album_title + ' (' + albums[i].artist_name + ')' });
    }
    const genreList = [{ value: '', label: 'No genre' }];
    for (let i = 0; i < genres.length; i++) {
      genreList.push({ value: genres[i].genre_id, label: genres[i].genre_name });
    }
    openForm('Edit song', [
      { name: 'title', label: 'Title', value: song.song_title },
      { name: 'album_id', label: 'Album', type: 'select', options: albumList, value: song.album_id },
      { name: 'genre_id', label: 'Genre', type: 'select', options: genreList, value: song.genre_id },
      { name: 'minutes', label: 'Minutes', type: 'number', value: Math.floor(song.duration / 60) },
      { name: 'seconds', label: 'Seconds', type: 'number', value: song.duration % 60, max: 59 },
      { name: 'youtube_id', label: 'YouTube Link or ID', value: song.youtube_id || '' },
      { name: 'audio_file', label: 'Replace with a local audio file (optional)', type: 'file', accept: 'audio/*,video/mp4,.flac' }
    ], async function (values) {
      if (values.audio_file && values.youtube_id.trim()) {
        throw new Error('Choose either a YouTube link or a local audio file, not both.');
      }
      await request('PUT', '/songs/' + songId, {
        title: values.title,
        artist_id: albumCache[values.album_id].artist_id,
        album_id: values.album_id,
        duration: readDuration(values.minutes, values.seconds),
        genre_id: values.genre_id,
        youtube_id: values.audio_file ? '' : values.youtube_id
      });
      if (values.audio_file) {
        await requestAudioUpload(songId, values.audio_file);
      }
      showMessage('Song updated', false);
      await refreshPage();
    });
  } catch (err) {
    showMessage(err.message, true);
  }
}

function deleteSong(songId) {
  const title = songCache[songId] ? songCache[songId].song_title : 'this song';
  if (!confirm('Delete "' + title + '"? It will also be removed from playlists, favorites and other lists.')) {
    return;
  }
  runAction(function () { return request('DELETE', '/songs/' + songId); }, 'Song deleted', function () { return showPage('songs'); });
}

// GJ-CHYLL MORTE
function rateSong(songId) {
  const score = $('ratingSelect').value;
  runAction(function () { return request('POST', '/ratings', { song_id: songId, score: score }); }, 'Rating saved', refreshPage);
}

function changeRating(ratingId, currentScore) {
  const options = [];
  for (let i = 5; i >= 1; i--) {
    options.push({ value: i, label: String(i) });
  }
  openForm('Change rating', [{ name: 'score', label: 'Rating (1 to 5)', type: 'select', options: options, value: currentScore }], async function (values) {
    await request('PUT', '/ratings/' + ratingId, { score: values.score });
    showMessage('Rating updated', false);
    await refreshPage();
  });
}

function deleteRating(ratingId) {
  if (!confirm('Remove this rating?')) {
    return;
  }
  runAction(function () { return request('DELETE', '/ratings/' + ratingId); }, 'Rating removed', refreshPage);
}

function submitComment(event, songId) {
  event.preventDefault();
  const text = event.target.elements.comment_text.value;
  runAction(function () { return request('POST', '/songs/' + songId + '/comments', { comment_text: text }); }, 'Comment added', refreshPage);
}

function editComment(commentId) {
  openForm('Edit comment', [{ name: 'comment_text', label: 'Comment', type: 'textarea', value: commentCache[commentId] }], async function (values) {
    await request('PUT', '/comments/' + commentId, { comment_text: values.comment_text });
    showMessage('Comment updated', false);
    await refreshPage();
  });
}

function deleteComment(commentId) {
  if (!confirm('Delete this comment?')) {
    return;
  }
  runAction(function () { return request('DELETE', '/comments/' + commentId); }, 'Comment deleted', refreshPage);
}

// ISAIAH JAIREH S. PERALTA
let artistCache = {};

async function loadArtists() {
  const artists = await request('GET', '/artists');
  const albums = await request('GET', '/albums');

  let artistRows = [];
  for (let i = 0; i < artists.length; i++) {
    artistCache[artists[i].artist_id] = artists[i];
    artistRows.push([
      esc(artists[i].artist_name),
      makeSeeMoreMenu([
        { label: 'Rename', action: 'editArtist(' + artists[i].artist_id + ')' },
        { label: 'Delete', action: 'deleteArtist(' + artists[i].artist_id + ')', extraClass: 'danger' }
      ])
    ]);
  }
  let albumRows = [];
  for (let i = 0; i < albums.length; i++) {
    albumCache[albums[i].album_id] = albums[i];
    albumRows.push([
      esc(albums[i].album_title),
      esc(albums[i].artist_name),
      makeSeeMoreMenu([
        { label: 'Delete', action: 'deleteAlbum(' + albums[i].album_id + ')', extraClass: 'danger' }
      ])
    ]);
  }

  let html = '<h2>Artists</h2>';
  html += makeTable(['Artist', ''], artistRows, 'There are no artists yet.');
  html += '<div class="box"><h3>Add an artist</h3><form onsubmit="submitArtist(event)"><div class="inline-fields">';
  html += '<label>Artist name <input type="text" name="artist_name" required maxlength="100"></label>';
  html += '<button type="submit" class="primary">Add artist</button></div></form></div>';

  html += '<h2>Albums</h2>';
  html += makeTable(['Album', 'Artist', ''], albumRows, 'There are no albums yet.');
  html += '<div class="box"><h3>Add an album</h3>';
  if (artists.length === 0) {
    html += '<p class="muted">Add an artist first.</p>';
  } else {
    html += '<form onsubmit="submitAlbum(event)"><div class="inline-fields">';
    html += '<label>Album title <input type="text" name="album_title" required maxlength="100"></label>';
    html += '<label>Artist <select name="artist_id">';
    for (let i = 0; i < artists.length; i++) {
      html += '<option value="' + artists[i].artist_id + '">' + esc(artists[i].artist_name) + '</option>';
    }
    html += '</select></label>';
    html += '<button type="submit" class="primary">Add album</button></div></form>';
  }
  html += '</div>';
  return html;
}

function submitArtist(event) {
  event.preventDefault();
  const name = event.target.elements.artist_name.value;
  runAction(function () { return request('POST', '/artists', { artist_name: name }); }, 'Artist added', refreshPage);
}

function submitAlbum(event) {
  event.preventDefault();
  const form = event.target;
  const body = { album_title: form.elements.album_title.value, artist_id: form.elements.artist_id.value };
  runAction(function () { return request('POST', '/albums', body); }, 'Album added', refreshPage);
}

function deleteAlbum(albumId) {
  const title = albumCache[albumId] ? albumCache[albumId].album_title : 'this album';
  if (!confirm('Delete "' + title + '"? Its songs will be deleted too.')) {
    return;
  }
  runAction(function () { return request('DELETE', '/albums/' + albumId); }, 'Album deleted', refreshPage);
}

function editArtist(artistId) {
  openForm('Rename artist', [{ name: 'artist_name', label: 'Artist name', value: artistCache[artistId].artist_name }], async function (values) {
    await request('PUT', '/artists/' + artistId, { artist_name: values.artist_name });
    showMessage('Artist updated', false);
    await refreshPage();
  });
}

function deleteArtist(artistId) {
  if (!confirm('Delete "' + artistCache[artistId].artist_name + '"? Their albums and songs will be deleted too.')) {
    return;
  }
  runAction(function () { return request('DELETE', '/artists/' + artistId); }, 'Artist deleted', refreshPage);
}


// ANTHONY SUPERIO
// PLAYLISTS
let playlistCache = {};

async function loadPlaylists() {
  const playlists = await request('GET', '/playlists');
  let rows = [];
  for (let i = 0; i < playlists.length; i++) {
    const p = playlists[i];
    playlistCache[p.playlist_id] = p;
    rows.push([
      '<a href="#" onclick="showPage(\'playlist\', ' + p.playlist_id + '); return false;">' + esc(p.playlist_name) + '</a>',
      makeSeeMoreMenu([
        { label: 'Open', action: 'showPage(\'playlist\', ' + p.playlist_id + ')' },
        { label: 'Rename', action: 'renamePlaylist(' + p.playlist_id + ')' },
        { label: 'Delete', action: 'deletePlaylist(' + p.playlist_id + ')', extraClass: 'danger' }
      ])
    ]);
  }
  let html = '<h2>My playlists</h2>';
  html += makeTable(['Playlist', ''], rows, 'You have no playlists yet.');
  html += '<div class="box"><h3>New playlist</h3><form onsubmit="submitPlaylist(event)"><div class="inline-fields">';
  html += '<label>Playlist name <input type="text" name="playlist_name" required maxlength="100"></label>';
  html += '<button type="submit" class="primary">Create playlist</button></div></form></div>';
  return html;
}

function submitPlaylist(event) {
  event.preventDefault();
  const name = event.target.elements.playlist_name.value;
  runAction(function () { return request('POST', '/playlists', { playlist_name: name }); }, 'Playlist created', refreshPage);
}

function renamePlaylist(playlistId) {
  openForm('Rename playlist', [{ name: 'playlist_name', label: 'Playlist name', value: playlistCache[playlistId].playlist_name }], async function (values) {
    await request('PUT', '/playlists/' + playlistId, { playlist_name: values.playlist_name });
    showMessage('Playlist renamed', false);
    await refreshPage();
  });
}

function deletePlaylist(playlistId) {
  if (!confirm('Delete the playlist "' + playlistCache[playlistId].playlist_name + '"?')) {
    return;
  }
  runAction(function () { return request('DELETE', '/playlists/' + playlistId); }, 'Playlist deleted', function () { return showPage('playlists'); });
}

async function loadPlaylist(playlistId) {
  const playlist = await request('GET', '/playlists/' + playlistId);
  cacheSongs(playlist.songs);
  playbackList = playlist.songs;
  let rows = [];
  for (let i = 0; i < playlist.songs.length; i++) {
    const s = playlist.songs[i];
    rows.push([
      songLink(s.song_id, s.song_title),
      esc(s.artist_name),
      formatTime(s.duration),
      makeSeeMoreMenu([
        { label: 'Play', action: 'playSong(' + s.song_id + ')' },
        { label: 'Add to queue', action: 'addToQueue(' + s.song_id + ')' },
        { label: 'Add to playlist', action: 'addToPlaylist(' + s.song_id + ')' },
        { label: 'Remove from playlist', action: 'removeFromPlaylist(' + playlistId + ', ' + s.song_id + ')', extraClass: 'danger' }
      ])
    ]);
  }
  let html = '<p><a href="#" onclick="showPage(\'playlists\'); return false;">Back to playlists</a></p>';
  html += '<h2>' + esc(playlist.playlist_name) + '</h2>';
  html += makeTable(['Title', 'Artist', 'Length', ''], rows, 'This playlist is empty. Open a song and use "Add to playlist".');
  return html;
}

function removeFromPlaylist(playlistId, songId) {
  runAction(function () { return request('DELETE', '/playlists/' + playlistId + '/songs/' + songId); }, 'Song removed from playlist', refreshPage);
}

// JADGE ETHAN ROY SIENES
async function loadFavorites() {
  const songs = await request('GET', '/favorites');
  cacheSongs(songs);
  playbackList = songs;
  let rows = [];
  //
  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    rows.push([
      songLink(s.song_id, s.song_title),
      esc(s.artist_name),
      formatTime(s.duration),
      makeSeeMoreMenu([
        { label: 'Play', action: 'playSong(' + s.song_id + ')' },
        { label: 'Add to queue', action: 'addToQueue(' + s.song_id + ')' },
        { label: 'Add to playlist', action: 'addToPlaylist(' + s.song_id + ')' },
        { label: 'Remove', action: 'removeFavorite(' + s.song_id + ')', extraClass: 'danger' }
      ])
    ]);
  }
  return '<h2>Favorites</h2>' + makeTable(['Title', 'Artist', 'Length', ''], rows, 'You have no favorite songs yet.');
}

async function loadQueue() {
  const songs = await request('GET', '/queue');
  cacheSongs(songs);
  playbackList = songs;
  let rows = [];
  //
  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    rows.push([
      String(i + 1),
      songLink(s.song_id, s.song_title),
      esc(s.artist_name),
      formatTime(s.duration),
      makeSeeMoreMenu([
        { label: 'Play', action: 'playSong(' + s.song_id + ')' },
        { label: 'Add to playlist', action: 'addToPlaylist(' + s.song_id + ')' },
        { label: 'Remove', action: 'removeFromQueue(' + s.queue_id + ')', extraClass: 'danger' }
      ])
    ]);
  }
  let html = '<h2>Queue</h2>';
  html += makeTable(['#', 'Title', 'Artist', 'Length', ''], rows, 'Your queue is empty. Open a song and use "Add to queue".');
  if (songs.length > 0) {
    html += makeButton('Clear queue', 'clearQueue()', 'danger');
  }
  return html;
}

function removeFromQueue(queueId) {
  runAction(function () { return request('DELETE', '/queue/' + queueId); }, 'Removed from queue', refreshPage);
}

function clearQueue() {
  if (!confirm('Remove all songs from your queue?')) {
    return;
  }
  runAction(function () { return request('DELETE', '/queue'); }, 'Queue cleared', refreshPage);
}

async function loadHistory() {
  const songs = await request('GET', '/history');
  cacheSongs(songs);
  playbackList = songs;
  let rows = [];
  //
  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    rows.push([
      songLink(s.song_id, s.song_title),
      esc(s.artist_name),
      formatTime(s.duration),
      makeSeeMoreMenu([
        { label: 'Play again', action: 'playSong(' + s.song_id + ')' },
        { label: 'Add to queue', action: 'addToQueue(' + s.song_id + ')' },
        { label: 'Add to playlist', action: 'addToPlaylist(' + s.song_id + ')' }
      ])
    ]);
  }
  let html = '<h2>History</h2><p class="muted">The last 50 songs you played, newest first.</p>';
  html += makeTable(['Title', 'Artist', 'Length', ''], rows, 'You have not played any songs yet.');
  if (songs.length > 0) {
    html += makeButton('Clear history', 'clearHistory()', 'danger');
  }
  return html;
}

function clearHistory() {
  if (!confirm('Clear your play history?')) {
    return;
  }
  runAction(function () { return request('DELETE', '/history'); }, 'History cleared', refreshPage);
}

async function loadDownloads() {
  const songs = await request('GET', '/downloads');
  cacheSongs(songs);
  playbackList = songs;
  let rows = [];
  //
  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    rows.push([
      songLink(s.song_id, s.song_title),
      esc(s.artist_name),
      formatTime(s.duration),
      makeSeeMoreMenu([
        { label: 'Play', action: 'playSong(' + s.song_id + ')' },
        { label: 'Add to queue', action: 'addToQueue(' + s.song_id + ')' },
        { label: 'Remove', action: 'removeDownload(' + s.download_id + ')', extraClass: 'danger' }
      ])
    ]);
  }
  return '<h2>Downloads</h2>' + makeTable(['Title', 'Artist', 'Length', ''], rows, 'You have not downloaded any songs yet.');
}

function removeDownload(downloadId) {
  runAction(function () { return request('DELETE', '/downloads/' + downloadId); }, 'Download removed', refreshPage);
}


// GJ-CHYLL MORTE
async function loadRatings() {
  const ratings = await request('GET', '/ratings');
  let rows = [];
  for (let i = 0; i < ratings.length; i++) {
    const r = ratings[i];
    rows.push([
      songLink(r.song_id, r.song_title),
      esc(r.artist_name),
      r.score + ' / 5',
      makeSeeMoreMenu([
        { label: 'Change rating', action: 'changeRating(' + r.rating_id + ', ' + r.score + ')' },
        { label: 'Remove rating', action: 'deleteRating(' + r.rating_id + ')', extraClass: 'danger' }
      ])
    ]);
  }
  return '<h2>My ratings</h2>' + makeTable(['Song', 'Artist', 'Rating', ''], rows, 'You have not rated any songs yet. Open a song to rate it.');
}



async function loadReports() {
  const songs = await request('GET', '/reports/songs');
  const left = await request('GET', '/reports/users-playlists');
  const full = await request('GET', '/reports/users-playlists-full');

  let songRows = [];
  for (let i = 0; i < songs.length; i++) {
    songRows.push([esc(songs[i].song_id), esc(songs[i].song_title), esc(songs[i].artist_name), esc(songs[i].album_title)]);
  }
  let leftRows = [];
  for (let i = 0; i < left.length; i++) {
    leftRows.push([esc(left[i].username), noneText(left[i].playlist_name, 'no playlist')]);
  }
  let fullRows = [];
  for (let i = 0; i < full.length; i++) {
    fullRows.push([noneText(full[i].title, 'no song'), noneText(full[i].genre_name, 'no genre')]);
  }
  /////////////////////////////////////////////////////////////////////////////////////
  let html = '<h2>Reports</h2>';
  html += '<h3>1. INNER JOIN: songs with their artist and album</h3>';
  html += makeTable(['ID', 'Song', 'Artist', 'Album'], songRows);
  html += '<h3>2. LEFT JOIN: all users and their playlists (users with no playlist are included)</h3>';
  html += makeTable(['User', 'Playlist'], leftRows);
  html += '<h3>3. FULL OUTER JOIN: everything from both sides (LEFT JOIN combined with RIGHT JOIN using UNION)</h3>';
  html += makeTable(['Song', 'Genre'], fullRows);
  return html;
}

////////////////////////////////////////////////////////////////////////////////////////////
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