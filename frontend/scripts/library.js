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