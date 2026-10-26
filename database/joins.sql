INNER JOIN

SELECT s.song_id, s.title, AS song.title, ar.artist_name, al.album_title, s.duration
FROM songs s
INNER JOIN artists ar ON s.artist_id = ar.artist_id
INNER JOIN albums al ON s.album_id = al.album_id

OUTER JOIN

SELECT ar.artist_id, ar.artist_name, s.title AS song_title
FROM artists ar
LEFT JOIN songs s ON ar.artist_id = s.artist_id

FULL OUTER JOIN

SELECT u.username, p.playlist_name
FROM users u
FULL OUTER JOIN playlists p ON u.user_id = p.user_id
UNION
SELECT u.username, p.playlist_name
FROM users u
FULL OUTER JOIN playlists p ON u.user_id = p.user_id