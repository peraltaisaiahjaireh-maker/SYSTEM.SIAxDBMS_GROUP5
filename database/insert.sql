-- 1. users
INSERT INTO users (user_id, username, email, password) VALUES 
(1, 'john_doe', 'john@example.com', 'password_1'),
(2, 'jane_smith', 'jane@example.com', 'password_2'),
(3, 'music_lover', 'lover@example.com', 'password_3'),
(4, 'opm_fanatic', 'opm@example.com', 'password_4'),
(5,'rock_enthusiast', 'rocke@example.com', 'password_5');

-- 2. profile
INSERT INTO profile (profile_id, user_id, bio) VALUES 
(6, 1, 'Big fan of 2000s post-grunge and rock covers.'),
(7, 2, 'Blinding lights and late night synth-pop vibes.'),
(8, 3, 'Curating the best local and international tracks.'),
(9, 4, 'Currently crying to OPM indie rock bands.'),
(10, 5, 'Lover of strong emotional lyricism.');

-- 3. settings
INSERT INTO settings (setting_id, user_id, theme) VALUES 
(66, 1, 'dark'),
(77, 2, 'light'),
(88, 3, 'dark'),
(99, 4, 'dark'),
(55, 5, 'light');

-- 4. artists
INSERT INTO artists (artist_id, artist_name) VALUES 
(11, 'SHEAN'),
(12, 'The Weeknd'),
(13, 'fitterkarma'),
(14, 'Cup of Joe'),
(15,'David Cook');

-- 5. albums
INSERT INTO albums (album_id, album_title, artist_id) VALUES 
(101,'ako ang bagyo - Single', 11),
(102, 'After Hours', 12),
(103, 'Kalapastangan - Single', 13),
(104, 'Silakbo', 14),
(105, 'American Idol Season 7', 15);

-- 6. songs
INSERT INTO songs (song_id, title, artist_id, album_id, duration, youtube_id, audio_path) VALUES 
(606, 'ako ang bagyo', 11, 101, 195, '3dSMi3Xl--E', '/audio/shean_ako_ang_bagyo.mp3'),
(607, 'Save Your Tears', 12, 102, 215, 'XXYlFuWEuKI', '/audio/the_weeknd_save_your_tears.mp3'),
(608, 'Kalapastangan', 13, 103, 276, 'FpJxPzveHzA', '/audio/fitterkarma_kalapastangan.mp3'),
(609, 'Multo', 14, 104, 237, 'CcS1fsuT10M', '/audio/cup_of_joe_multo.mp3'),
(610, 'Always Be My Baby', 15, 105, 233, 'roTsk2fP0kU', '/audio/david_cook_always_be_my_baby.mp3');

-- 7. genres
INSERT INTO genres (genre_id, genre_name) VALUES 
(100, 'OPM Indie'),
(300, 'Synth-Pop'),
(200, 'OPM Rock Ballad'),
(400, 'Pop Rock'),
(500, 'Alternative Rock');

-- 8. song_genres
INSERT INTO song_genres (song_id, genre_id) VALUES 
(606, 100), -- ako ang bagyo -> OPM Indie
(607, 200), -- Save Your Tears -> Synth-Pop
(608, 300), -- Kalapastangan -> OPM Rock Ballad
(609, 400), -- Multo -> Pop Rock
(610, 500); -- Always Be My Baby (Rock Version) -> Alternative Rock

-- 9. playlists
INSERT INTO playlists (playlist_id, user_id, playlist_name) VALUES 
(111, 1, '2000s Rock Nostalgia'),
(222, 2, 'Late Night Roadtrip'),
(333, 3, 'Ultimate OPM Hits'),
(444, 4, 'Sentimental Breakdown'),
(555, 5, 'Daily Rotation Mix');

-- 10. playlist_songs
INSERT INTO playlist_songs (playlist_song_id, song_id) VALUES 
(1111, 610), -- Rock Nostalgia -> Always Be My Baby (David Cook)
(2222, 607), -- Late Night -> Save Your Tears
(3333, 609), -- Ultimate OPM -> Multo
(3334, 606), -- Ultimate OPM -> ako ang bagyo
(4444, 608); -- Sentimental -> Kalapastangan

-- 11. favorites
INSERT INTO favorites (favorite_id, user_id, song_id) VALUES 
(201, 1, 610),
(202, 2, 607),
(203, 3, 609),
(204, 4, 606),
(205, 5, 608);

-- 12. history
INSERT INTO history (history_id, user_id, song_id) VALUES 
(301, 1, 610),
(302, 2, 607),
(303, 3, 609),
(304, 4, 608),
(305, 5, 606);

-- 13. queue
INSERT INTO queue (queue_id, user_id, song_id) VALUES 
(401, 1, 606),
(402, 1, 607),
(403, 2, 609),
(404, 3, 610),
(405, 4, 607);

-- 14. downloads
INSERT INTO downloads (download_id, user_id, song_id) VALUES 
(501, 1, 610),
(502, 2, 607),
(503, 3, 609),
(504, 4, 608),
(505, 5, 606);

-- 15. ratings
INSERT INTO ratings (rating_id, user_id, song_id, score) VALUES 
(601, 1, 610, 5),
(602, 2, 607, 5),
(603, 3, 609, 5),
(604, 4, 608, 4),
(605, 5, 606, 5);

-- 16. comments
INSERT INTO comments (comment_id, user_id, song_id, comment_text) VALUES 
(701, 1, 610, 'Simon Cowell was wrong, this rock arrangement is sheer genius.'),
(702, 2, 607, 'The 80s synth production on this album is immaculate.'),
(703, 3, 609, 'This track deserved all its record-breaking chart run milestones!'),
(704, 4, 608, 'Such a heavy, beautiful local rock release.'),
(705, 5, 606, 'The lyrics of this track hit right in the chest.');
