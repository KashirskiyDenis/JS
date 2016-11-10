'use strict';

module.exports = function(req, res, next) {
	req.session.redirectTo = req.path;
	next();
};