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

async function getAudioDuration(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio();

    audio.preload = 'metadata';
    audio.onloadedmetadata = function () {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration));
    };
    audio.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error('This audio file could not be read for its duration.'));
    };

    audio.src = url;
  });
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
    const songDuration = audioFile
      ? await getAudioDuration(audioFile)
      : readDuration(form.elements.minutes.value, form.elements.seconds.value);

    const created = await request('POST', '/songs', {
      title: form.elements.title.value,
      artist_id: albumCache[albumId].artist_id,
      album_id: albumId,
      duration: songDuration,
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