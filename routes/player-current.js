'use strict';

let fs = require("fs");
let config = require("config");
let HttpError = require('error').HttpError;
let Song = require('models/player/song').Song;
let Playlist = require('models/player/playlist').Playlist;
let types = ["song", "album", "playlist"];
let mongoose = require('libs/mongoose');

exports.get = function(req, res, next) {
	let type = req.params.type;
	let owner = req.session.user;
	let value = req.query.value;
	let path = req.path;
	let params = { path : req.path, songs : [], idPlaylist : "" };
	
	if (type) {
		path = path.slice(0, path.lastIndexOf("/"));
	}
	
	if (!type || !owner) {
		res.render('player', params);
	} else {
		if (!value) {
			res.redirect("/player/current");
		} else {
			let promise;
			let query;
			
			if (type === "album") {
				promise = Song.where({ album : value, owner : owner }).exec();;
			} else if (type === "song") {
				promise = Song.where({ _id : value, owner : owner }).exec();;
			} else if (type === "playlist") {
				params.idPlaylist = value;
				
				if (!mongoose.Types.ObjectId.isValid(value)) {
					return next(new HttpError(404, "Not found."));
				} else {
					promise = Playlist.findById(value).exec().then(playlist => {
						return Song.find({ _id : { $in : playlist.songs } }).exec();
					});
				}
			}

			promise.then(songs => {
				params.songs = songs;
				
				res.render('player', params);
			})
			.catch(error => next(error));
		}
	}
};
