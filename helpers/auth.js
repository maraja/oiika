var config = require('../config');
var oauth = require('../config/oauth');
var rp = require('request-promise');
var passport = require('passport');
var passportLocal = require('passport-local');
var passportFacebook = require('passport-facebook');
var passportGoogle = require('passport-google-oauth');
var jwt = require('jsonwebtoken');
var api = require('./api');
var ipinfo = require('./ipinfo');

// serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  //query database or cache here, IF you need more info that what's already in obj (session)
  done(null, obj);
});

function tokenize(id) {
	return jwt.sign({
		iss: 'oiika',
		uid: id,
		exp: (Math.floor(Date.now() / 1000)) + (60 * 60 * 24 * 30), //expire in 30 days from now
	}, config.token_secret);
}

// passport strategies
// local
passport.use('login', new passportLocal.Strategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback : true
  },
  function (req, email, password, done) {
    var data = {
      'email': req.body.email,
      'password': req.body.password,
    }

    api.post('auth/login', data).then(result => {
      var token = tokenize(result.result.account_id);
      req.auth_provider = 'local';
      req.auth_status = 'success';
      req.auth_message = 'Welcome back, ' + result.result.first_name;
      req.auth_token = token;

      return done(null, result.result);
    })
    .catch(err => {
      if(typeof err.error.code !== 'undefined' && err.error.code == 'SCHEMA_VALIDATION_FAILED') {
        var error_message = "Authentication Failed - Invalid Data";
      } else {
        var error_message = "Authentication Failed - An internal error occurred";
      }

      req.auth_provider = 'local';
      req.auth_status = 'error';
      req.auth_message = error_message;
      req.auth_token = '';

      return done(null, false);
    });
  });
));

passport.use('signup', new passportLocal.Strategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback : true
  },
  function (req, email, password, done) {
    if(req.session.signup_type == 'tutor') {
      var user_type = 'tutor';
    } else {
      var user_type = 'tutee';
    }

    var location = ipinfo.location();

    Promise.all([location]).then(values => {
      var data = {
        'first_name': req.body.first_name,
        'last_name': req.body.last_name,
        'email': req.body.email,
        'password': req.body.password,
        'user_type': user_type
      }

      if(values[0] != '') {
        var lat_lng = values[0].split(',');
        data.location_lat = parseFloat(lat_lng[0]);
        data.location_lng = parseFloat(lat_lng[1]);
      }

      api.post('auth/signup', data).then(result => { console.log("result: " + result.result);
        req.auth_provider = 'local';
        req.auth_status = 'success';
        req.auth_message = 'Success!<br>We have sent you a confirmation email. Please follow the link in the email to verify your account.';
        req.auth_token = '';

        return done(null, result.result);
      })
      .catch(err => {
        console.log("error: " + err.error);
        if(typeof err.error.code !== 'undefined' && err.error.code == 'SCHEMA_VALIDATION_FAILED') {
          var error_message = "Authentication Failed - Invalid Data";
        } else {
          var error_message = "Authentication Failed - An internal error occurred";
        }

        req.auth_provider = 'local';
        req.auth_status = 'error';
        req.auth_message = error_message;
        req.auth_token = '';

        return done(null, false);
      });
    });
  }
));

// facebook
passport.use(new passportFacebook.Strategy({
    clientID: oauth.facebook.clientID,
    clientSecret: oauth.facebook.clientSecret,
    callbackURL: oauth.facebook.callbackURL,
    profileFields: ['id', 'name', 'gender', 'photos', 'emails'],
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    if(req.session.signup_type == 'tutor') {
      var user_type = 'tutor';
    } else {
      var user_type = 'tutee';
    }

    var location = ipinfo.location();

    Promise.all([location]).then(values => {
      var data = {
        'facebook_id': profile.id,
        'first_name': profile.name.givenName,
        'last_name': profile.name.familyName,
        'email': profile.emails[0].value,
        'gender': profile.gender,
        'profile_picture': 'http://graph.facebook.com/' + profile.id + '/picture?type=large',
        'user_type': user_type
      }

      if(values[0] != '') {
        var lat_lng = values[0].split(',');
        data.location_lat = parseFloat(lat_lng[0]);
        data.location_lng = parseFloat(lat_lng[1]);
      }

      api.post('auth/facebook', data).then(result => {
        var token = tokenize(result.result.account_id);
        req.auth_provider = 'facebook';
        req.auth_status = 'success';
        req.auth_message = 'Welcome back, ' + profile.name.givenName;
        req.auth_token = token;

        return done(null, result.result);
      })
      .catch(err => {
        if(typeof err.error.code !== 'undefined' && err.error.code == 'SCHEMA_VALIDATION_FAILED') {
          var error_message = "Authentication Failed - Invalid Data";
        } else {
          var error_message = "Authentication Failed - An internal error occurred";
        }

        req.auth_provider = 'facebook';
        req.auth_status = 'error';
        req.auth_message = error_message;
        req.auth_token = '';

        return done(null, false);
      });

    });
  }
));

//google
passport.use(new passportGoogle.OAuth2Strategy({
    clientID: oauth.google.clientID,
    clientSecret: oauth.google.clientSecret,
    callbackURL: oauth.google.callbackURL,
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {

    if(req.session.signup_type == 'tutor') {
      var user_type = 'tutor';
    } else {
      var user_type = 'tutee';
    }

    var location = ipinfo.location();

    Promise.all([location]).then(values => {
      var data = {
        'google_id': profile.id,
        'first_name': profile.name.givenName,
        'last_name': profile.name.familyName,
        'email': profile.emails[0].value,
        'gender': profile.gender,
        'profile_picture': profile.photos[0].value + '0',
        'user_type': user_type
      }

      if(values[0] != '') {
        var lat_lng = values[0].split(',');
        data.location_lat = parseFloat(lat_lng[0]);
        data.location_lng = parseFloat(lat_lng[1]);
      }

      api.post('auth/google', data).then(result => {
        var token = tokenize(result.result.account_id);
        req.auth_provider = 'google';
        req.auth_status = 'success';
        req.auth_message = 'Welcome back, ' + profile.name.givenName;
        req.auth_token = token;

        return done(null, result.result);
      })
      .catch(err => {
        if(typeof err.error.code !== 'undefined' && err.error.code == 'SCHEMA_VALIDATION_FAILED') {
          var error_message = "Authentication Failed - Invalid Data";
        } else {
          var error_message = "Authentication Failed - An internal error occurred";
        }

        req.auth_provider = 'google';
        req.auth_status = 'error';
        req.auth_message = error_message;
        req.auth_token = '';

        return done(null, false);
      });

    });
  }
));
