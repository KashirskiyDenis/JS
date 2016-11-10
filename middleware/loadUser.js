'use strict';

let User = require('models/user').User;
let HttpError = require('error').HttpError;

module.exports = function(req, res, next) {
	req.user = res.locals.user = null;
	if (!req.session.user) {
		return next();
	}
	
	let promise = User.findById(req.session.user).exec();
	
	promise.then(user => {
		req.user = res.locals.user = user;
		next();
	})
	.catch(error => next(error));
};