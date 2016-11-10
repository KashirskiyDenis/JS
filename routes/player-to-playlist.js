'use strict';

let Playlist = require('models/player/playlist').Playlist;

exports.post = function(req, res, next) {
	let id = req.body.idSong;
	let pls = req.body.pls;
	let action = req.body.action;

	if (!pls) {
		pls = [];
	}

	if (!(pls instanceof Array)) {
		pls = [pls];
	}
	
	if (action === "delete") {
		Playlist.deleteFromPlaylist(id, pls)
		.then(pls => res.json(pls))
		.catch(error => next(error));
	} else {
		Playlist.insertToPlaylist(id, pls)
		.then(pls => res.json(pls))
		.catch(error => next(error));
	}
};
