'use strict';

let mongoose = require('libs/mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
	title : String,
	owner : String,
	songs : {
		type : Array,
		default : []
	}
});

schema.statics.insert = function(title, owner) {
	let Playlist = this;

	let playlist = new Playlist({
		title : title,
		owner : owner
	});

	return playlist.save();
};

schema.statics.update = function(id, title) {
	let Playlist = this;
	let promise = Playlist.findById(id).exec();

	return promise.then(playlist => {
		playlist.title = title;

		return playlist.save();
	});
};

schema.statics.delete = function(id) {
	let Playlist = this;
	let promise = Playlist.remove({ _id : id }).exec();

	return promise;
};

schema.statics.deleteSong = function(idPl, idSong) {
	let Playlist = this;
	let promise = Playlist.findById(idPl);
	
	return promise.then(playlist => {
		let newSongs = [];
		
		for (let song of playlist.songs) {
			if (song !== idSong) {
				newSongs.push(song);
			}
		}
		
		playlist.songs = newSongs;
		
		return playlist.save();
	});
};

schema.statics.insertToPlaylist = function(idSong, pls) {
	let Playlist = this;
	let query = Playlist.find({ _id : { $in : pls } });

	let promise = query.exec();
	
	return promise.then(playlists => {
		for (let pl of playlists) {
			if (pl.songs.indexOf(idSong) === -1) {
				pl.songs.push(idSong);
				pl.save();
			}
		}
		return playlists;
	});
};

schema.statics.deleteFromPlaylist = function(idSong, pls) {
	let Playlist = this;
	
	if (!(pls instanceof Array)) {
		pls = [pls];
	}
	
	let query = Playlist.find({ _id : { $in : pls } });
	let promise = query.exec();
	
	return promise.then(playlists => {
		for (let pl of playlists) {
			let index = pl.songs.indexOf(idSong);
			if (index !== -1) {
				pl.songs.splice(index, 1);
				pl.save();
			}
		}
		return playlists;
	});
};

exports.Playlist = mongoose.model('Playlist', schema);
