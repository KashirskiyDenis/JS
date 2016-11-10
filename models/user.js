'use strict';

let crypto = require('crypto');
let mongoose = require('libs/mongoose.js');
let Schema = mongoose.Schema;
let HttpError = require('error').HttpError;

let schema = new Schema({
	login : {
		type : String,
		unique : true,
		required : true
	},
	hashedPassword : {
		type : String,
		required : true
	},
	salt : {
		type : String,
		required : true
	}
});

schema.methods.encryptPassword = function(password) {
	return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

schema.virtual('password')
	.set(function(password) {
		this._plainPassword = password;
		this.salt = Math.random() + "";
		this.hashedPassword = this.encryptPassword(password);
	})
	.get(function() {
		return this._palinPassword;
	});
	
schema.methods.checkPassword = function(password) {
	return this.encryptPassword(password) === this.hashedPassword;
};

schema.statics.authorize = function(login, password) {
	let User = this;
	
	let query = User.findOne({ login : login });
	let promise = query.exec();
	
	return promise.then(user => {
		if (user) {
			if (!user.checkPassword(password)) {
				return Promise.reject(new HttpError(403, "Некорректный пароль."));
			}
			return user;
		} else {
			return null;
		}
	});
};

schema.statics.insert = function(login, password) {
	let User = this;
	
	let newUser = new User({
		login : login,
		password : password
	});
	
	return newUser.save();	
};

schema.statics.update = function(id, login, password, callback) {
	let User = this;
	
	User.findById(id, function(err, user) {
		if (err) {
			callback(err);
		}
		
		user.login = login;
		
		if (password !== "")
			user.password = password;
		
		user.save(function(err, user, affected) {
			if (err)
				return callback(err);
			callback(null, user);
		});	
	});
};

schema.statics.delete = function(id, callback) {
	let User = this;
	
	User.remove({ _id : id }, function(err) {
		if (err)
			callback(err);
		callback(null);
	});
};

exports.User = mongoose.model('User', schema);