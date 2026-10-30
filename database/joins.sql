getAlbums
SELECT albums.album_id, albums.album_title, albums.artist_id, artists.artist_name
FROM albums
INNER JOIN artists ON albums.artist_id = artists.artist_id
ORDER BY albums.album_title

SONG_QUERY
SELECT songs.song_id, songs.title AS song_title, songs.artist_id, songs.album_id,
         artists.artist_name, albums.album_title, songs.duration, songs.youtube_id, songs.audio_path
FROM songs
INNER JOIN artists ON songs.artist_id = artists.artist_id
INNER JOIN albums ON songs.album_id = albums.album_id

getAllSongGenres
SELECT song_genres.song_id, genres.genre_id, genres.genre_name
FROM song_genres
INNER JOIN genres ON song_genres.genre_id = genres.genre_id

getPlaylistSongs
SELECT songs.song_id, songs.title AS song_title, artists.artist_name, songs.duration
FROM playlist_songs
INNER JOIN songs ON playlist_songs.song_id = songs.song_id
INNER JOIN artists ON songs.artist_id = artists.artist_id
WHERE playlist_songs.playlist_id = ?
ORDER BY songs.title

getFavorites
SELECT songs.song_id, songs.title AS song_title, artists.artist_name, songs.duration
FROM favorites
INNER JOIN songs ON favorites.song_id = songs.song_id
INNER JOIN artists ON songs.artist_id = artists.artist_id
WHERE favorites.user_id = ?
ORDER BY favorites.favorite_id DESC

getDownloads
SELECT downloads.download_id, songs.song_id, songs.title AS song_title, artists.artist_name, songs.duration
FROM downloads
INNER JOIN songs ON downloads.song_id = songs.song_id
INNER JOIN artists ON songs.artist_id = artists.artist_id
WHERE downloads.user_id = ?
ORDER BY downloads.download_id DESC

getQueue
SELECT queue.queue_id, songs.song_id, songs.title AS song_title, artists.artist_name, songs.duration
FROM queue
INNER JOIN songs ON queue.song_id = songs.song_id
INNER JOIN artists ON songs.artist_id = artists.artist_id
WHERE queue.user_id = ?
ORDER BY queue.queue_id

getHistory
SELECT history.history_id, songs.song_id, songs.title AS song_title, artists.artist_name, songs.duration
FROM history
INNER JOIN songs ON history.song_id = songs.song_id
INNER JOIN artists ON songs.artist_id = artists.artist_id
WHERE history.user_id = ?
ORDER BY history.history_id DESC
LIMIT 50

getRatings
SELECT ratings.rating_id, ratings.song_id, ratings.score, songs.title AS song_title, artists.artist_name
FROM ratings
INNER JOIN songs ON ratings.song_id = songs.song_id
INNER JOIN artists ON songs.artist_id = artists.artist_id
WHERE ratings.user_id = ?
ORDER BY ratings.rating_id DESC

getComments
SELECT comments.comment_id, comments.user_id, comments.comment_text, users.username
FROM comments
INNER JOIN users ON comments.user_id = users.user_id
WHERE comments.song_id = ?
ORDER BY comments.comment_id

reportSongs
INNER JOIN

SELECT songs.song_id, songs.title AS song_title, artists.artist_name, albums.album_title
FROM songs
INNER JOIN artists ON songs.artist_id = artists.artist_id
INNER JOIN albums ON songs.album_id = albums.album_id

reportUsersPlaylists
OUTER JOIN

SELECT users.username, playlists.playlist_name
FROM users
LEFT JOIN playlists ON users.user_id = playlists.user_id

reportUsersPlaylistsFull
FULL OUTER JOIN

SELECT users.username, playlists.playlist_name
FROM users
LEFT JOIN playlists ON users.user_id = playlists.user_id
UNION
SELECT users.username, playlists.playlist_name
FROM users
RIGHT JOIN playlists ON users.user_id = playlists.user_id