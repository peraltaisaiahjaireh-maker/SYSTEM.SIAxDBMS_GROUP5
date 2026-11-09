-- users
INSERT INTO users (username, email, password) VALUES 
('pinoy_chart_watcher', 'charts@example.ph', '$2b$12$K3rjFvWd59jS2H...'),
('manila_grooves', 'grooves@example.ph', '$2b$12$8xLmPqW1A9vR7F...'),
('makati_jazzy', 'jazz@example.ph', '$2b$12$YtRvN91pQwxB3C...');

-- artists
INSERT INTO artists (artist_name) VALUES 
('IV OF SPADES'),             
('Cup of Joe'),               
('Linkin Park'),              
('Hev Abi'),                  
('David Guetta'),             
('Philippine Philharmonic'),  
('Laufey'),                   
('Gary Clark Jr.'),           
('Shania Twain'),             
('Dionela');                  

-- albums
INSERT INTO albums (album_title, artist_id) VALUES 
('Kabisado - Single', 1),
('Multo - Single', 2),
('From Zero', 3),
('MADUMING TIMOG', 4),
('POP DAT THANG (Remixes)', 5),
('CCP Orchestral Masterworks', 6),
('Bewitched', 7),
('JPEG RAW', 8),
('Come On Over', 9),
('Marilag - Single', 10);

-- songs
INSERT INTO songs (title, artist_id, album_id, duration, youtube_id, audio_path) VALUES 
('Kabisado', 1, 1, 248, 'egb_5-ZnsW0', '/audio/kabisado.mp3'),
('Multo', 2, 2, 237, '1633186641614145', '/audio/multo.mp3'),
('The Emptiness Machine', 3, 3, 190, 'oKr22WAkP4M', '/audio/emptiness_machine.mp3'),
('ALL NIGHT LONG', 4, 4, 198, 'xehrbnf6EqU', '/audio/all_night_long.mp3'),
('POP DAT THANG (David Guetta Mix)', 5, 5, 184, 'aSgKz9WbXzY', '/audio/pop_dat_thang.mp3'),
('Anak (Symphonic Orchestral Version)', 6, 6, 320, 'SxEGRpFYBfQ', '/audio/anak_symphonic.mp3'),
('From The Start', 7, 7, 169, 'Uw-eUt3q25E', '/audio/from_the_start.mp3'),
('Pearl Cadillac', 8, 8, 305, 'ySgKz9WbXzU', '/audio/pearl_cadillac.mp3'),
('Youre Still The One', 9, 9, 213, 'bSgKz9WbXzT', '/audio/still_the_one.mp3'),
('Marilag', 10, 10, 157, 'E-161913721', '/audio/marilag.mp3');

-- playlists
INSERT INTO playlists (user_id, playlist_name) VALUES 
(1, 'Billboard PH Hot 100 Loop'),
(2, 'Acoustic & Lounge Staples'),
(3, 'Club Anthem Starters');

-- playlist_songs
INSERT INTO playlist_songs (playlist_id, song_id) VALUES 
(1, 1), 
(1, 2), 
(1, 4), 
(2, 7), 
(2, 9), 
(3, 3), 
(3, 5); 

-- favorites
INSERT INTO favorites (user_id, song_id) VALUES 
(1, 2),
(1, 10),
(2, 7),
(3, 5);

-- history
INSERT INTO history (user_id, song_id) VALUES 
(1, 1),
(1, 2),
(2, 7),
(2, 9),
(3, 5),
(3, 3);

-- genres
INSERT INTO genres (genre_name) VALUES 
('Rock'),
('Hip Hop'),
('Electronic (EDM)'),
('Classical'),
('Jazz'),
('Blues'),
('Country'),
('R&B/Soul'),
('Folk/World');

-- song_genres
INSERT INTO song_genres (song_id, genre_id) VALUES 
(1, 1),  
(2, 1),  
(3, 1),  
(4, 2),  
(5, 3),  
(6, 4),  
(7, 5),  
(8, 6),  
(9, 7),  
(10, 8), 
(10, 9); 

-- ratings
INSERT INTO ratings (user_id, song_id, score) VALUES 
(1, 2, 5),
(1, 10, 5),
(2, 7, 5),
(3, 5, 4);

-- comments
INSERT INTO comments (user_id, song_id, comment_text) VALUES 
(1, 2, 'Cup of Joe keeps breaking records with Multo. Absolute masterpiece!'),
(2, 7, 'Laufey has completely revitalized standard vocal jazz for Gen Z in Manila.'),
(3, 3, 'Linkin Park back on top on local alt-rock stations. Heavy rotation!');

-- queue
INSERT INTO queue (user_id, song_id) VALUES 
(1, 10),
(2, 9),
(3, 5);

-- settings
INSERT INTO settings (user_id, theme) VALUES 
(1, 'dark'),
(2, 'dark'),
(3, 'light');

-- downloads
INSERT INTO downloads (user_id, song_id) VALUES 
(1, 2),
(2, 7),
(3, 3);

-- profile
INSERT INTO profile (user_id, bio) VALUES 
(1, 'Tracking the Billboard PH Top 25 daily.'),
(2, 'Unwinding to local coffee house covers and classic acoustics.'),
(3, 'Festival chaser, electronic soundscapes only.');

-- comments
INSERT INTO comments (comment_id, user_id, song_id, comment_text) VALUES 
(701, 1, 610, 'Simon Cowell was wrong, this rock arrangement is sheer genius.'),
(702, 2, 607, 'The 80s synth production on this album is immaculate.'),
(703, 3, 609, 'This track deserved all its record-breaking chart run milestones!'),
(704, 4, 608, 'Such a heavy, beautiful local rock release.'),
(705, 5, 606, 'The lyrics of this track hit right in the chest.');
