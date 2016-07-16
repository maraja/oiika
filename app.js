var express = require('express'),
	jsdom = require('jsdom').jsdom,
	document = jsdom('<html></html>', {}),
	window = document.defaultView,
	$ = require('jquery')(window),
	stylus = require('stylus'),
	nib = require('nib');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var routes = require('./routes/index');
var users = require('./routes/users');
var config = require('./config');

var app = express();



// MONGOOSE MONGODB CONNECTION TEST
var tutorModel = require('./db/models/Tutors')();
var db = config.db[config.environment];
var db_connection_string = db.dialect + "://" + 
	db.username + ":" + 
	db.password + "@" +
	db.host + ":" + 
	db.port + "/" + 
	db.database;

var mongo_db = mongoose.connect(db_connection_string);

tutorModel.find({}, function(err, docs) {
	if(err) console.log(err);
	console.log(docs);
});
// END MONGO TEST



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

function compile(str, path) {
	return stylus(str).set('filename', path).use(nib());
}

app.use('/scripts', express.static(__dirname + '/node_modules'));

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;
