'use strict';

let mongoose = require('libs/mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
	path : String,
	name : String,
	artist : String,
	title : String,
	album : String,
	number : Number,
	year : Number,
	owner : {
		type : String,
		default : ""
	},
	duration : Number
});

schema.virtual('time')
	.set(function(time) {
		this.duration = duration;
	})
	.get(function() {
		let seconds = parseInt(this.duration);
		let s = seconds % 60;
		seconds -= s;
		s = Math.round(s);
		if (s < 10) {
			s = "0" + s.toString();
		}
		let m = seconds / 60;
		seconds -= m * 60;
		m = Math.round(m);
		if (m < 10) {
			m = "0" + m.toString();
		}
		return (seconds === 0 ? "" : seconds + ":") + m + ":" + s;	
	});
	
schema.statics.insert = function(path, name, artist, title, album, number, year, duration, owner) {
	let Song = this;
	
	let song = new Song({
		path : path,
		name : name,
		artist : artist === undefined ? "Undefined artist" : artist,
		title : title === undefined ? "Undefined title" : title,
		album : album === undefined ? "Undefined album" : album,
		number : number === undefined ? 0 : number,
		year : year === undefined ? 0 : year,
		owner : owner,
		duration : duration
	});
	
	return song.save();
};

exports.Song = mongoose.model("Song", schema);
