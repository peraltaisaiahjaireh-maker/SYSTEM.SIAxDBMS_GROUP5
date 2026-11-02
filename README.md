# SYSTEM.SIAxDBMS_GROUP5
# SoundSync

SoundSync’s standout feature is its unified music player: it can play both uploaded audio files and YouTube tracks, while keeping them in the same personal library and playback experience. It also brings playlists, favorites, queue, and listening history together for each user. You can see this in the PLAYER INTERFACE and PLAYBACK LOGIC.

//SAMPLE MVC's           
SOUNDSYNC 
├── .gitignore
├── soundSync.drawio
├── README.md
├── package.json
├── index.js
├── .env
├── .env.example
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   └── soundSyncModel.js
│   ├── controllers/
│   │   └── soundSyncController.js
│   ├── routes/
│   │   └── apiRoutes.js
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
|── database/
|   ├── schema.sql 
|   └── data.sql
|── bg-image/

| Member | Github username | Tables | Endpoints/Screens | Join report(s) and join type | Feature role |
| :--- | :---: | :---: | :---: | :---: | ---: |
| Peralta | peraltaisaiahjaireh-maker peralta0721 | artist, albums and songs | /artists, /artists/:id, /albums/:id and /albums | INNER JOIN albums, songs and reportSongs(songs) |Full backend build and fixer, Full frontend control and build, Full database control (Local database MySQL), Repository owner, Group leader, debugger, code structure idea, all responsibilities are mine|
| Morte | Yuzuu021 Chyllpogi · he/him | history, queue and comments | /ratings, /ratings/:id, /songs/:id/comments, /comments/:id, /reports/songs, /reports/users-playlists and /reports/users-playlists-full | INNER JOIN ratings and comments | Controllers and Models Contribution with Database Queries and Tables, server.js and also Frontend HTML CSS |
| Salva | salvajherald131-eng jheraldd01 | genres and song_genres | /songs, /songs/:id/audio, /songs/:id, /songs, and /genres | INNER JOIN favorites and downloads | Controllers and Models Contribution with Databse Tables and Database Flow Chart Maker |
| Paligsa | hardejeamspaligsa-dot | users, profiles and settings | /users, /login, /logout, /users/me and /settings | LEFT JOIN reportUsersPlaylist(users) and FULL OUTER JOIN reportPlaylistFull(users) | Controllers and Models Contribution with Database Queries and Tables fixer |
| Superio | anthonysuperio4 | playlists, playlist_songs and ratings | /playlists, playlist/:id, /playlist/:id/songs and /playlists/:id/songs/:songId | INNER JOIN song_genres and playlist_songs | Controllers and Models Contribution with Database Tables |
| Sienes | jadgeethansienes | favorites and downloads | /favorites, /favorites/:songId, /downloads, /downloads/:id, /queue, /queue/:id, /history | INNER JOIN queue and history | Controllers and Model Contribution with Database Tables |