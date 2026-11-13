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
MVC
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
│   |-- controllers/
|   |   |---accountModel.js
|   |   |---artistsModel.js
|   |   |---libraryModel.js
|   |   |---playlistsModel.js
|   |   |---ratingsModel.js
|   |   |---songsModel.js
│   |-- routes/
│   │   |--- apiRoutes.js
│   |-- server.js
|-- frontend/
|   |-- scripts
|   |   |---acount.js
|   |   |---api.js
|   |   |---artists.js
|   |   |---core.js
|   |   |---library.js
|   |   |---player.js
|   |   |---playlists.js
|   |   |---ratings.js
|   |   |---reports.js
|   |   |---songs.js
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
| Peralta, Isaiah Jaireh S. | peraltaisaiahjaireh-maker `peralta0721` | `artist`, `albums` | `/artists`, `/artists/:id`, `/albums/:id`, `/albums` - `ARTISTS` | (1) INNER JOIN `Album and Artist Report` |Serves as Partial full-Stack Lead and Project Manager, overseeing system architecture, frontend and backend structure idea, MySQL database administration, repository management, artistsController.js/helper.js/artistsModel.js and code syntax fixer.|
| Morte, GJ-Chyll | Chyllpogi `Yuzuu021` · he/him | `ratings`, `comments` | `/ratings`, `/ratings/:id`, `/songs/:id/comments`, `/comments/:id`, `/reports/songs`, `/reports/users-playlists`, `/reports/users-playlists-full` - `RATINGS` | (2) INNER JOIN `Song Ratings Report`, `Song comments Report` | Partial full-Stack Lead (server.js, MVC ratingsController.js/ratingsModel.js, database queries, and HTML/CSS/JS frontend) |
| Salva, Jherald | salvajherald131-eng `jheraldd01` | `songs`, `genres`, `song_genres` | `/songs`, `/songs/:id/audio`, `/songs/:id`, `/songs`, `/genres` `SONGS` | (3) INNER JOIN `Song Detail Report`, `Song Genre Report`, `Users Playlists Reports` | Partial Full-Stack Developer & Data Modeler (songsController.js, songsModels.js, Database Tables/Flowcharts, Frontend JS) |
| Paligsa, Harde Jeams | `hardejeamspaligsa-dot` | `users`, `profiles`, `settings` | `/users`, `/login`, `/logout`, `/users/me`, `/settings` `ACCOUNT` | (1) LEFT JOIN and (1) FULL OUTER JOIN `User Playlists Report`, `Song Genre Audit` | Partial Full-Stack Lead (accountController.js, accountModel.js, Master DB Queries/Tables, Frontend JS) |
| Superio, Anthony | `anthonysuperio4` | `playlists`, `playlist_songs` | `/playlists`, `playlist/:id`, `/playlist/:id/songs`, `/playlists/:id/songs/:songId` `PLAYLISTS` | (1) INNER JOIN `Playlist Songs Report` | Partial Full-Stack Developer (playlistsController.js, playlistsModel.js, Partial Master DB Queries/Tables, Frontend JS) |
| Sienes, Jadge Ethan Roy | `jadgeethansienes` | `favorites`, `downloads`, `queue`, `history` | `/favorites`, `/favorites/:songId`, `/downloads`, `/downloads/:id`, `/queue`, `/queue/:id`, `/history` `LIBRARY` | (4) INNER JOIN `Favorite Songs Report` `Downloaded Songs Report`, `Queue Report`, `Play History Report` | Partial Full-Stack Lead (libraryController.js, libraryModel.js, Partial Master DB Queries/Tables, Frontend JS) |

`Partial Full-Stack Developer: Used informally to describe handling both frontend and backend tasks without taking full ownership of the overall system architecture.`

## SUGGESTED SPLIT
| AREA | WHAT IT COVERS | NAMES |
|---|---|---|
| Core | Users, roles, login, shared layout, database set-up | Peralta |
| Master data | Lookup and reference tables (categories, branches, statuses) | Paligsa, Morte, Salva |
| Transactions | The central business records (orders, bookings, request) | Salva, Morte |
| Unique feature | The rules and logic behind your major feature | Superio, Peralta |
| Reports | Join-based reports, summaries, dashboards | Morte, Peralta |
| Audit | Activity log, status history, alerts | Sienes |

## How to run our System
```
NEED TO INSTALL
-VSCODE
-WEB DEV EXTENTIONS
-GIT
-MYSQL (COMMAND LINE CLIENT 0R WORKBENCH (MUST HAVE AT LEAST 1 OF THIS MYSQL TOOLS) )
-.drawio (FOR FLOW CHART DATABASE TABLES VSCODE_EXTENSIONS)

1. git clone 
2. Set-up MySQL local database
   -CREATE DATABASE soundSync;
   -USE soundsync
   -Then paste all the table queries from the file /database/schema.sql
   -Also paste the genre data insert queries from insert.sql (Only the (--7 genres) this is for default inputs)
   -add file and name it .env (Use the reference from .env.example)
   -On .env and /config/db.js set-up your connections to MySQL database
3. npm install
4. npm start/npm run start
5. On your browser enter this <http://localhost:5000> to access our screens. 
```

## My attendance checking per member (SpreedSheet)
```
https://docs.google.com/spreadsheets/d/1zuETq0kWIjtRhXhYhnpYZzag4OmcPYLptCJ21FFMBj4/edit?usp=sharing
```

## Important Info for our git Branches 
``` 
We made multiple branches before due git push error that we cannot resolve, however they are still recorded commits from those deleted branches.
```