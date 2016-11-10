'use strict';

let fs = require("fs");
let config = require("config");
let Song = require('models/player/song').Song;

exports.get = function(req, res, next) {
	let plId = req.query.plId;
	let album = req.query.album;
	let params = { path : req.path, songs : [] };

	if (plId || album == undefined) {
		res.render('player', params);
	} else {
		let query = Song.find();

		if (album) {
			if (album === "Without album") {
				album = "";
			}
			query = Song.where({ album : album }).sort({ "number" : 1 });
		}

		let promise = query.exec();

		promise.then(songs => {
			if (!album && album !== "") {
				params.songs = songs.filter(song => song.playlists.indexOf(plId) !== -1);
			} else {
				params.songs = songs;
			}

			res.render('player', params);
		})
		.catch(error => next(error));
	}
};
