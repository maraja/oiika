var express = require('express');
var methodOverride = require('method-override');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var config = require('./config');
var oauth = require('./config/oauth');
var passport = require('passport');
var passportLocal = require('passport-local');
var passportFacebook = require('passport-facebook');
var passportGoogle = require('passport-google-oauth');

//routes
var routes = require('./routes/index');

// serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(obj, done) {
  //query database or cache here!
  done(null, {
    id: 123,
    name: "Reza"
  });
});

// passport strategies
// local
passport.use(new passportLocal.Strategy(function (username, password, done) {
  //do databsae call
  //var result = mongoDb.login(username, password);
  var result = 1;
  if(result) {
    done(null, result);
  } else {
    done(null, null); //error
  }
}));

// facebook
passport.use(new passportFacebook.Strategy({
  clientID: oauth.facebook.clientID,
  clientSecret: oauth.facebook.clientSecret,
  callbackURL: oauth.facebook.callbackURL,
  profileFields: ['id', 'name', 'gender', 'photos', 'emails']
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken);
    console.log(refreshToken);
    console.log(profile);
    //http://graph.facebook.com/603718516475999/picture?type=large
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

// google
passport.use(new passportGoogle.OAuth2Strategy({
  clientID: oauth.google.clientID,
  clientSecret: oauth.google.clientSecret,
  callbackURL: oauth.google.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken);
    console.log(refreshToken);
    console.log(profile);
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//pass requested page URL as a local var to be used by views
app.use(function(req, res, next){
  res.locals.path = req.path;
  res.locals.req = req;
  // res.local.isAuthenticated = req.isAuthenticated();
  // res.local.user = req.user;
  next();
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(methodOverride());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({
  secret: 'oiika',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);


// ERROR HANDLERS

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

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
