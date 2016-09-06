var express = require('express');
var methodOverride = require('method-override');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
var rp = require('request-promise');
var favicon = require('serve-favicon');
var logger = require('morgan');
var config = require('./config');
var passport = require('passport');
var auth = require('./helpers/auth');
var api = require('./helpers/api');
var util = require('util');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(methodOverride());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({
  secret: config.session_secret,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

//pass requested page URL as a local var to be used by views
app.use(function(req, res, next){
  res.locals.path = req.path;
  res.locals.req = req;
  next();
});

//routes
var routes = require('./routes/index');

app.use('/', routes);


// ERROR HANDLERS
// Handle 404
app.use(function(req, res) {
  res.status(404);
  res.render('error/404', {title: '404'});
});

// Handle 500
app.use(function(error, req, res, next) {
  res.status(500);
  if (config.environment === 'development') {
    res.render('error/500', {title: '500', error: error});
  } else {
    res.render('error/500');
  }
});

module.exports = app;
