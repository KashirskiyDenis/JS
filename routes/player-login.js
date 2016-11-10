'use strict';

var User = require('models/user').User;

exports.get = function(req, res) {
	let params = { path : req.path };

	if (req.session.user) {
		res.redirect('/player/current');
	} else {
		res.render('player-login', params);
	}
};

exports.post = function(req, res, next) {
	let login = req.body.login;
	let password = req.body.password;
	let registration = req.body.registration === "on" ? true : false;
	
	User.authorize(login, password).then(user => {
		if (user) {
			return user;
		} else {
			if (registration) {
				user = User.insert(login, password);
			}
			return user;
		}
	})
	.then(user => {
		if (user) {
			req.session.user = user._id;
			if (req.session.redirectTo !== req.path && req.session.redirectTo) {
				res.redirect(req.session.redirectTo);
			} else {
				res.redirect('/player/current');
			}
		} else {
			res.render('player-login', { path : null });
		}
	})
	.catch(error => next(error));
};