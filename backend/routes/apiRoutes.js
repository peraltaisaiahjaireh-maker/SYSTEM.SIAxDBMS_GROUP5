// ROUTES: connects each URL and method to a controller function.
const express = require("express");
const controller = require("../controllers/soundSyncController");

const router = express.Router();
const login = controller.requireLogin; // routes with login need a logged-in user

// Account
router.post("/users", controller.register);
router.post("/login", controller.login);
router.post("/logout", login, controller.logout);
router.get("/users/me", login, controller.getMe);
router.put("/users/me", login, controller.updateMe);
router.delete("/users/me", login, controller.deleteMe);
router.put("/settings", login, controller.updateSettings);

// Artists and albums
router.get("/artists", login, controller.listArtists);
router.get("/artists/:id", login, controller.getArtist);
router.post("/artists", login, controller.createArtist);
router.put("/artists/:id", login, controller.updateArtist);
router.delete("/artists/:id", login, controller.deleteArtist);
router.delete("/albums/:id", login, controller.deleteAlbum);
router.get("/albums", login, controller.listAlbums);
router.post("/albums", login, controller.createAlbum);

// Songs and genres
router.get("/songs", login, controller.listSongs);
router.get("/songs/:id/audio", login, controller.streamSongAudio);
router.get("/songs/:id", login, controller.getSong);
router.post("/songs", login, controller.createSong);
router.put("/songs/:id/audio", login, express.raw({ type: "*/*", limit: "50mb" }), controller.uploadSongAudio);
router.put("/songs/:id", login, controller.updateSong);
router.delete("/songs/:id", login, controller.deleteSong);
router.get("/genres", login, controller.listGenres);

// Playlists
router.get("/playlists", login, controller.listPlaylists);
router.get("/playlists/:id", login, controller.getPlaylist);
router.post("/playlists", login, controller.createPlaylist);
router.put("/playlists/:id", login, controller.renamePlaylist);
router.delete("/playlists/:id", login, controller.deletePlaylist);
router.post("/playlists/:id/songs", login, controller.addSongToPlaylist);
router.delete("/playlists/:id/songs/:songId", login, controller.removeSongFromPlaylist);

// Favorites and downloads
router.get("/favorites", login, controller.listFavorites);
router.post("/favorites", login, controller.addFavorite);
router.delete("/favorites/:songId", login, controller.removeFavorite);
router.get("/downloads", login, controller.listDownloads);
router.post("/downloads", login, controller.addDownload);
router.delete("/downloads/:id", login, controller.removeDownload);

//Queue and history
router.get("/queue", login, controller.listQueue);
router.post("/queue", login, controller.addToQueue);
router.delete("/queue", login, controller.clearQueue);
router.delete("/queue/:id", login, controller.removeFromQueue);
router.get("/history", login, controller.listHistory);
router.post("/history", login, controller.addHistory);
router.delete("/history", login, controller.clearHistory);

//Ratings and comments
router.get("/ratings", login, controller.listRatings);
router.post("/ratings", login, controller.createRating);
router.put("/ratings/:id", login, controller.updateRating);
router.delete("/ratings/:id", login, controller.deleteRating);
router.get("/songs/:id/comments", login, controller.listComments);
router.post("/songs/:id/comments", login, controller.createComment);
router.put("/comments/:id", login, controller.updateComment);
router.delete("/comments/:id", login, controller.deleteComment);

//the three joins
router.get("/reports/songs", login, controller.reportSongs); // INNER JOIN
router.get("/reports/users-playlists", login, controller.reportUsersPlaylists); // LEFT JOIN
router.get("/reports/users-playlists-full", login, controller.reportUsersPlaylistsFull); // FULL OUTER JOIN

module.exports = router;
