// GJ-Chyll Morte

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

  let html = '<h2>Reports</h2>';
  html += '<h3>1. INNER JOIN: songs with their artist and album</h3>';
  html += makeTable(['ID', 'Song', 'Artist', 'Album'], songRows);
  html += '<h3>2. LEFT JOIN: all users and their playlists (users with no playlist are included)</h3>';
  html += makeTable(['User', 'Playlist'], leftRows);
  html += '<h3>3. FULL OUTER JOIN: everything from both sides (LEFT JOIN combined with RIGHT JOIN using UNION)</h3>';
  html += makeTable(['Song', 'Genre'], fullRows);
  return html;
}