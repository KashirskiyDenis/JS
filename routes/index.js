'use strict';

let checkAuth = require('middleware/checkAuth');
let redirectTo = require('middleware/redirectTo');

module.exports = function(app) {
	app.get('/', require('./main').get);

	app.get('/watch', require('./watch').get);

	app.get('/player/current/:type?', redirectTo, require('./player-current').get);
	app.get('/player/add', redirectTo, checkAuth, require('./player-add').get);
	app.post('/player/add', checkAuth, require('./player-add').post);
	app.post('/player/add/toPlaylist', require('./player-to-playlist').post);
	app.get('/player/playlists/:type?', redirectTo, checkAuth, require('./player-playlists').get);
	app.get('/player/playlists/personal/add', redirectTo, require('./player-playlists-add').get);
	app.post('/player/playlists/personal/add', require('./player-playlists-add').post);
	app.delete('/player/playlists/personal/add', require('./player-playlists-add').delete);
	app.get('/player/login', require('./player-login').get);
	app.post('/player/login', require('./player-login').post);
	app.post('/player/logout', require('./player-logout').post);
	app.get('/player/json/:type', require('./player-json').get);
};
