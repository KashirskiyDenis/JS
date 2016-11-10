'use strict';

exports.post = function(req, res, next) {
	req.session.destroy();
	res.redirect('/player/current');
};