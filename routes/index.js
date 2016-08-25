var express = require('express');
var router = express.Router();
var passport = require('passport');
var tutor = require('../lib/tutor');
var api = require('../helpers/api');

function auth(req, res, next) {
	if(typeof req.user !== "undefined") {
		//console.log(req.user);
	}
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/login');
}

function saveSignupType(req, res, next) {
	if(req.query.signup_type == 'tutor') {
		req.session.signup_type = 'tutor';
	} else {
		req.session.signup_type = 'tutee';
	}
	next();
}

/* GET home page. */
router.get('/', api.get('index', true), function (req, res, next) {
	res.render('index', {title: 'Home'});
});

router.post('/login', passport.authenticate('local'), function (req, res, next) {
	res.redirect('/');
});

router.post('/signup', function (req, res, next) {
	passport.authenticate('signup', function(err, user) {
		// if(user !== false) {
		// 	req.logIn(user, function(err) {
	  //     if (err) { return next(err); }
		//
		// 		res.send({"success": true, "message": "Welcome back, " + user.first_name});
	  //   });
		// }
		//
		// res.send({"error": true, "message": err});
	})(req, res, next);
});

router.get('/auth/facebook', [saveSignupType, passport.authenticate('facebook', {scope: ['email']})], function(req, res) {});
router.get('/auth/facebook/callback', function(req, res, next) {
	passport.authenticate('facebook', function(err, user) {
		if(user !== false) {
			req.logIn(user, function(err) {
	      if (err) { return next(err); }
	    });
		}

		res.render('auth_callback');
	})(req, res, next);
});

router.get('/auth/google', [saveSignupType, passport.authenticate('google', {scope: ['email profile']})], function(req, res) {});
router.get('/auth/google/callback', function(req, res, next) {
	passport.authenticate('google', function(err, user) {
		if(user !== false) {
			req.logIn(user, function(err) {
	      if (err) { return next(err); }
	    });
		}

		res.render('auth_callback');
	})(req, res, next);
});

router.get('/auth_callback', function (req, res, next) {
	res.render('auth_callback', {});
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login');
});

router.get('/tutor/:id', tutor.loadProfile, function (req, res, next) {
  res.render('tutor_profile');
});

router.get('/settings', auth, function (req, res, next) {
	if(req.user.user_type == 'tutor') {
  	res.render('tutor_settings');
	} else if(req.user.user_type == 'tutee') {
		res.render('tutor_profile');
	}
});

router.get('/search' , function (req, res, next) {
	res.render('search', {
		title: 'Search',
		tutors: req.tutors
	});
});

module.exports = router;
