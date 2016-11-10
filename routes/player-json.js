'use strict';

let Song = require('models/player/song').Song;
let Playlist = require('models/player/playlist').Playlist;
let mongoose = require('libs/mongoose');
let types = new Map();

(function init() {
	types.set("song", Song);
	types.set("playlist", Playlist);
})();

exports.get = function(req, res, next) {
	let type = req.params.type;
	let owner = req.session.user;
	let id = req.query.id;
	
	if (!types.has(type)) {
		return next();
	}
	
	let query;
	
	if (id) {
		if (mongoose.Types.ObjectId.isValid(id)) {
			query = types.get(type).where({ _id : id, owner : owner });
		}
	} else {
		query = types.get(type).where({ owner : owner });
	}
	
	if (query) {
		let promise = query.exec();

		promise.then(data => res.send(data))
		.catch(error => next(error));		
	} else {
		return next();
	}
};
