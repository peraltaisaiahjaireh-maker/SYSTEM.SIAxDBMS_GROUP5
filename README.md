# SYSTEM.SIAxDBMS_GROUP5
# SoundSync

SoundSync’s standout feature is its unified music player: it can play both uploaded audio files and YouTube tracks, while keeping them in the same personal library and playback experience. It also brings playlists, favorites, queue, and listening history together for each user. You can see this in the PLAYER INTERFACE and PLAYBACK LOGIC.

## Unique Feature
Genre-Hop Mix 
-which shuffles all the songs automatically
and also
Can use songrecords from your local files and youtube_url to upload an audio 

## List of Members
```
Group Leader:
Peralta, Isaiah Jaireh S. 
Members:
Paligsa, Harde Jeams
Morte, GJ-Chyll 
Salva, Jherald
Superio, Anthony
Sienes, Jadge Ethan Roy
```

## Project Structure
```text
SOUNDSYNC/
|-- .gitignore
|-- .env
|-- .env.example
|-- soundSync.drawio
|-- README.md
|-- package.json
|-- index.js
|-- backend/
│   |-- config/
│   │   |--- db.js
│   |-- models/
|   |   |---accountController.js
|   |   |---artistController.js
|   |   |---helpers.js
|   |   |---libraryControllers.js
|   |   |---playlistsController.js
|   |   |---ratingsController.js
|   |   |---songsController.js
│   │   |--- soundSyncModel.js
│   |-- controllers/
|   |   |---accountModel.js
|   |   |---artistsModel.js
|   |   |---libraryModel.js
|   |   |---playlistsModel.js
|   |   |---ratingsModel.js
|   |   |---songsModel.js
│   │   |--- soundSyncController.js
│   |-- routes/
│   │   |--- apiRoutes.js
│   |-- server.js
|-- frontend/
│   |-- index.html
│   |-- style.css
│   |-- app.js
|-- database/
|   |-- insert.sql
│   |-- schema.sql
│   |-- data.sql
|-- bg-image/
```

| Member | Github username | Tables | Endpoints/Screens | Join report(s) and join type | Feature role |
| :--- | :---: | :---: | :---: | :---: | ---: |
| Peralta, Isaiah Jaireh S. | peraltaisaiahjaireh-maker peralta0721 | artist and albums | /artists, /artists/:id, /albums/:id and /albums | INNER JOIN albums, songs and reportSongs(songs) |Full backend build, idea and fixer, Full frontend main build and fixer HTML CSS JavaScript, Full database control (Local database MySQL), Repository owner, Group leader, Debugger, Code file structure idea, All responsibilities are mine|
| Morte, GJ-Chyll | Yuzuu021 Chyllpogi · he/him | ratings and comments | /ratings, /ratings/:id, /songs/:id/comments, /comments/:id, /reports/songs, /reports/users-playlists and /reports/users-playlists-full | INNER JOIN ratings and comments | Controllers and Models Contribution with Database Queries and Tables, server.js and also Frontend HTML CSS JavaScript |
| Salva, Jherald | salvajherald131-eng jheraldd01 | songs, genres and song_genres | /songs, /songs/:id/audio, /songs/:id, /songs, and /genres | INNER JOIN favorites and downloads | Controllers and Models Contribution with Database Tables, Database Flow Chart Maker and Frontend JavaScript |
| Paligsa, Harde Jeams | hardejeamspaligsa-dot | users, profiles and settings | /users, /login, /logout, /users/me and /settings | LEFT JOIN reportUsersPlaylist(users) and FULL OUTER JOIN reportPlaylistFull(users) | Controllers and Models Contribution with Master Database Queries, Tables fixer and Frontend JavaScript |
| Superio, Anthony | anthonysuperio4 | playlists and playlist_songs | /playlists, playlist/:id, /playlist/:id/songs and /playlists/:id/songs/:songId | INNER JOIN song_genres and playlist_songs | Controllers and Models Contribution with Database Tables and Frontend JavaScript|
| Sienes, Jadge Ethan Roy | jadgeethansienes | favorites, downloads, queue and history | /favorites, /favorites/:songId, /downloads, /downloads/:id, /queue, /queue/:id, /history | INNER JOIN queue and history | Controllers and Model Contribution with Database Tables and Frontend JavaScript|

## SUGGESTED SPLIT
| AREA | WHAT IT COVERS | NAMES |
|---|---|---|
| Core | Users, roles, login, shared layout, database set-up | Peralta |
| Master data | Lookup and reference tables (categories, branches, statuses) | Paligsa |
| Transactions | The central business records (orders, bookings, request) | Salva |
| Unique feature | The rules and logic behind your major feature | Superio |
| Reports | Join-based reports, summaries, dashboards | Morte |
| Audit | Activity log, status history, alerts | Sienes |

## How to run our System
```
1. git clone 
2. Set-up MySQL local database
   -CREATE DATABASE soundSync;
   -USE soundsync
   -Then paste all the table queries from the file /database/schema.sql
   -On .env and /config/db.js set-up your connections to MySQL database
3. npm install
4. npm start/npm run start

NEED TO INSTALL
-VSCODE
-WEB DEV EXTENTIONS
-GIT
-MYSQL (COMMAND LINE CLIENT 0R WORKBENCH (MUST HAVE AT LEAST 1 OF THIS MYSQL TOOLS) )
-.drawio (FOR FLOW CHART DATABASE TABLES VSCODE_EXTENSIONS)
```