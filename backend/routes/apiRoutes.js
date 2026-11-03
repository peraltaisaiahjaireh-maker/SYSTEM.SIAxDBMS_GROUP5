// connects each URL and method to a controller function.
const express = require('express');
const accountController = require('../controllers/accountController');
const artistsController = require('../controllers/artistsController');
const songsController = require('../controllers/songsController');
const playlistsController = require('../controllers/playlistsController');
const libraryController = require('../controllers/libraryController');
const ratingsController = require('../controllers/ratingsController');
const { requireLogin } = require('../controllers/helpers');

const router = express.Router();
const login = requireLogin; // logged-in user

// Account (Harde Jeams Paligsa)
router.post('/users', accountController.register);
router.post('/login', accountController.login);
router.post('/logout', login, accountController.logout);
router.get('/users/me', login, accountController.getMe);
router.put('/users/me', login, accountController.updateMe);
router.delete('/users/me', login, accountController.deleteMe);
router.put('/settings', login, accountController.updateSettings);

// Artists and albums (Isaiah Jaireh S. Peralta)
router.get('/artists', login, artistsController.listArtists);
router.get('/artists/:id', login, artistsController.getArtist);
router.post('/artists', login, artistsController.createArtist);
router.put('/artists/:id', login, artistsController.updateArtist);
router.delete('/artists/:id', login, artistsController.deleteArtist);
router.delete('/albums/:id', login, artistsController.deleteAlbum);
router.get('/albums', login, artistsController.listAlbums);
router.post('/albums', login, artistsController.createAlbum);

// Songs and genres (Jherald Salva)
router.get('/songs', login, songsController.listSongs);
router.get('/songs/:id/audio', login, songsController.streamSongAudio);
router.get('/songs/:id', login, songsController.getSong);
router.post('/songs', login, songsController.createSong);
router.put('/songs/:id/audio', login, express.raw({ type: '*/*', limit: '50mb' }), songsController.uploadSongAudio);
router.put('/songs/:id', login, songsController.updateSong);
router.delete('/songs/:id', login, songsController.deleteSong);
router.get('/genres', login, songsController.listGenres);

// Playlists (Anthony Superio)
router.get('/playlists', login, playlistsController.listPlaylists);
router.get('/playlists/:id', login, playlistsController.getPlaylist);
router.post('/playlists', login, playlistsController.createPlaylist);
router.put('/playlists/:id', login, playlistsController.renamePlaylist);
router.delete('/playlists/:id', login, playlistsController.deletePlaylist);
router.post('/playlists/:id/songs', login, playlistsController.addSongToPlaylist);
router.delete('/playlists/:id/songs/:songId', login, playlistsController.removeSongFromPlaylist);

// Favorites and downloads (Jadge Ethan Roy Sienes)
router.get('/favorites', login, libraryController.listFavorites);
router.post('/favorites', login, libraryController.addFavorite);
router.delete('/favorites/:songId', login, libraryController.removeFavorite);
router.get('/downloads', login, libraryController.listDownloads);
router.post('/downloads', login, libraryController.addDownload);
router.delete('/downloads/:id', login, libraryController.removeDownload);

//Queue and history (Jadge Ethan Roy Sienes)
router.get('/queue', login, libraryController.listQueue);
router.post('/queue', login, libraryController.addToQueue);
router.delete('/queue', login, libraryController.clearQueue);
router.delete('/queue/:id', login, libraryController.removeFromQueue);
router.get('/history', login, libraryController.listHistory);
router.post('/history', login, libraryController.addHistory);
router.delete('/history', login, libraryController.clearHistory);

//Ratings and comments (GJ-Chyll Morte)
router.get('/ratings', login, ratingsController.listRatings);
router.post('/ratings', login, ratingsController.createRating);
router.put('/ratings/:id', login, ratingsController.updateRating);
router.delete('/ratings/:id', login, ratingsController.deleteRating);
router.get('/songs/:id/comments', login, ratingsController.listComments);
router.post('/songs/:id/comments', login, ratingsController.createComment);
router.put('/comments/:id', login, ratingsController.updateComment);
router.delete('/comments/:id', login, ratingsController.deleteComment);

//the three joins (GJ-Chyll Morte)
router.get('/reports/songs', login, songsController.reportSongs); // INNER JOIN
router.get('/reports/users-playlists', login, playlistsController.reportUsersPlaylists); // LEFT JOIN
router.get('/reports/users-playlists-full', login, playlistsController.reportUsersPlaylistsFull); // FULL OUTER JOIN

module.exports = router;
