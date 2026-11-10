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
