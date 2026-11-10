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