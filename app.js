var express = require('express');
var http = require('http');
var path = require('path');
var config = require('config');
var HttpError = require('error').HttpError;
var mongoose = require('libs/mongoose');

var app = express();

app.engine('ejs', require('ejs-locals'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

http.createServer(app).listen(config.get('port'), function(){
  console.log('Express server listening on port ' + config.get('port'));
});

app.use(express.favicon());

app.use(express.logger('dev'));

app.use(express.bodyParser({ uploadDir: config.get('path-tmp') }));
app.use(express.cookieParser());

var MongoStore = require('connect-mongo')(express);

// http://www.senchalabs.org/connect/session.html
app.use(express.session({
	secret : config.get('session:secret'),
	key : config.get('session:key'),
	cookie : config.get('session:cookie'),
	store : new MongoStore({ mongooseConnection : mongoose.connection })
}));

app.use(require('middleware/sendHttpError'));
app.use(require('middleware/loadUser'));

app.use(app.router);

require('routes')(app);

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
	next(new HttpError(404, "Страница не найдена."));
});

app.use(function(error, req, res, next) {
	if (error instanceof HttpError) {
		res.sendHttpError(error);
	} else {
		console.log(error);
			// error = new HttpError(500, "Внутренняя ошибка сервера.");
			res.sendHttpError(error);	
		// if (app.get('env') === "development") {
			// express.errorHandler()(error, req, res, next);
		// } else {
			// error = new HttpError(500, "Внутренняя ошибка сервера.");
			// res.sendHttpError(error);
		// }
	}
});
