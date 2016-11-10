'use strict';

let Song = require('models/player/song').Song;
let Playlist = require('models/player/playlist').Playlist;
let types = ["artists", "albums", "personal", "all"];

let groupAlbumByArtist = (songs) => {
	let albumByArtist = new Map();

	for (let song of songs) {
		if (albumByArtist.has(song.artist)) {
			if (albumByArtist.get(song.artist).has(song.album)) {
				let tmp = albumByArtist.get(song.artist).get(song.album);
				albumByArtist.get(song.artist).set(song.album, tmp + 1);
			} else {
				albumByArtist.get(song.artist).set(song.album, 1);
			}
		} else {
			let map = new Map();
			map.set(song.album, 1);
			albumByArtist.set(song.artist, map);
		}
	}

	if (albumByArtist.has("")) {
		albumByArtist.set("Without artist", albumByArtist.get(""));
		albumByArtist.delete("");
	}

	return albumByArtist;
};

let groupSongByAlbum = (songs) => {
	let songByAlbum = new Map();

	for (let song of songs) {
		if (songByAlbum.has(song.album)) {
			songByAlbum.get(song.album).songs.push(song.title);
		} else {
			songByAlbum.set(song.album, { songs : [song.title],  artist : song.artist });
		}
	}

	if (songByAlbum.has("")) {
		songByAlbum.set("Without album", songByAlbum.get(""));
		if (songByAlbum.get("Without album").songs.length !== 1) {
			songByAlbum.get("Without album").artist = "Without artist";
		} else {
			if (songByAlbum.get("Without album").songs[0].artist !== "") {
				songByAlbum.get("Without album").artist = songByAlbum.get("Without album").songs[0].artist;
			}
		}
		songByAlbum.delete("");
	}

	return songByAlbum;
};

let groupSongByPersonalPL = (songs) => {
	let songByPersonalPL = new Map();

	for (let song of songs) {
		let pls = song.playlists;
		for (let pl of pls) {
			if (songByPersonalPL.has(pl)) {
				songByPersonalPL.get(pl).push(song.title);
			} else {
				songByPersonalPL.set(pl, [song.title]);
			}
		}
	}

	return songByPersonalPL;
};

exports.get = function(req, res, next) {
	let type = req.params.type;
	let path = req.path;

	if (path !== "/player/playlists") {
		path = path.slice(0, path.lastIndexOf("/"));
	}
	
	if (types.indexOf(type) === -1 && type !== undefined) {
		return next();
	}

	let owner = req.session.user;
	let query = Song.find({ $or : [{ owner : owner }, { owner : "" }] });
	let promise = query.exec();
	let params = { path : path, pl : type, albums : [], artists : [], personal : [], all : [] };

	promise.then(songs => {
		if (!type || type === "albums") {
			params.albums = groupSongByAlbum(songs);
		} else if (type === "artists") {
			params.artists = groupAlbumByArtist(songs);
		}  else if (type === "all") {
			params.all = songs;
		} else {
			query = Playlist.find({ owner : owner});
			return query.exec();
		}
		return null;
	})
	.then(pls => {
		if (pls) {
			params.personal = pls;
		}
		res.render("player-playlists", params);
	})
	.catch(error => next(error));
};
