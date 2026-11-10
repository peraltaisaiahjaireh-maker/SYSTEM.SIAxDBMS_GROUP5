// Isaiah Jaireh S. Peralta
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

let playlistCache = {};
