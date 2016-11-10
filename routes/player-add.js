'use strict';

let HttpError = require('error').HttpError;
let mp3Info = require('mp3info').getMP3Info;
let id3 = require('id3js');
let mp3Duration = require('mp3-duration');
let fs = require('fs');
let config = require('config');

let Song = require('models/player/song').Song;

let deleteFilePromise = (pathFile) => {
	return new Promise(function(resolve, reject) {
		fs.unlink(pathFile, function(error) {
			if (error) {
				reject(error);
			}
			resolve();
		}); 
	});
};

let remaneFilePromise = (tmpPath, newPath) => {
	return new Promise(function(resolve, reject) {
		fs.rename(tmpPath, newPath, function(error) {
			if (error) {
				reject(error);
			}
			resolve(newPath);
		});
	});
};

let printError = (error) => {
	let date = new Date();
	console.error(date);
	console.log(error.code);
	console.log(error.path);
	console.log(error);
};

exports.get = function(req, res) {
	res.render('player-add', { path : req.path });
};

exports.post = function(req, res, next) {
	let files = req.files.files;
	let array = [];

	if (!(files instanceof Array)) {
		files = [files];
	}

	let index = 0;
	let len = files.length - 1;
	
	for (let file of files) {
		if (file.size === 0) {
			deleteFilePromise(file.path)
				.catch(error => {
					printError(error);
				});
		} else {
			let fileName = file.name;
			let tmpPath = file.path;
			let newPath = config.get('path-music') + fileName;

			remaneFilePromise(tmpPath, newPath).then(path => {
 				// new Promise(function(resolve, reject) {
					// id3({ file: path, type: id3.OPEN_LOCAL }, function(error, tags) {
						// if (error) {
							// reject(error);
						// }
						// else {
							// resolve(tags);
							// console.log(tags);
						// }
					// });
				// });
				return mp3Info(path);
			})
			.then(tags => {
				if (tags.duration === null)	{
					return new Promise(function(resolve, reject) {
						mp3Duration(newPath, function (error, duration) {
							if (error) {
								reject(error);
							}
							tags.duration = parseInt(duration);
							resolve(tags);
						});
					});
				} else {
					return tags;
				}
			})
			.then(tags => {
				let owner = req.session.user;
				let artist = tags.v1.artist || tags.v2.artist;
				let title = tags.v1.title || tags.v2.title;
				let album = tags.v1.album || tags.v2.album;
				let number = tags.v1.number || tags.v2.number;
				let year = tags.v1.year || tags.v2.year;
				let duration = tags.duration;
				
				// array.push(tags);
				
				return Song.insert(newPath, fileName, artist, title, album, number, year, duration, owner);
			})
			.catch(error => {
				printError(error);
				array.push(fileName);
			})
			.then(response => {
				if (index === (files.length - 1)) {
					res.json(array);
				}
				index++;
			});
		}
	}

	// res.json({ notAdd : array });
};
