'use strict';

let Playlist = require('models/player/playlist').Playlist;
let Song = require('models/player/song').Song;
let HttpError = require('error').HttpError;

exports.get = function(req, res, next) {
	let params = { path : "/player/playlists", pl : "personal", playlists : [] };
	let owner = req.session.user;

	let query = Playlist.find({ owner : owner });
	let promise = query.exec();

	promise.then(playlists => {
		params.playlists = playlists;
		res.render("player-playlists-add", params);
	})
	.catch(error => next(error));
};

exports.post = function(req, res, next) {
	let owner = req.session.user;
	let title = req.body.title;
	let idPl = req.body.idPlaylist;
	let newPlaylist = req.body.newPlaylist;

	if (newPlaylist) {
		Playlist.insert(title, owner).then(playlist => {
			res.json(playlist);
		})
		.catch(error => next(error));
	} else {
		if (idPl) {
			Playlist.update(idPl, title).then(playlist => {
				res.json(playlist);
			})
			.catch(error => next(error));
		} else {
			res.json({});
		}
	}
};

exports.delete = function(req, res, next) {
	let owner = req.session.user;
	let idPl = req.body.idPlaylist;

	if (idPl) {
		Playlist.delete(idPl).then(response => {
			res.json({ message: "ok" });
		})
		.catch(error => next(error));
	} else {
		return next(new HttpError(404, "Not found"));
	}
};
