var express = require('express');
var router = express.Router();
var passport = require('passport');
var api = require('../helpers/api');
var tutor = require('../lib/tutor');

function auth(req, res, next) {
	if(typeof req.user !== "undefined") {
		//console.log(req.user);
	}
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/login');
}

function validate() {
	//IF API DATA has error field, redirect to error page

	//Otherwise
	return next();
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

router.post('/login', function (req, res, next) {
	passport.authenticate('login', function(err, user) {
		if(user !== false) {
			req.logIn(user, function(err) {
	      if (err) { return next(err); }

				res.send({"success": true, "message": req.auth_message, "token": req.auth_token});
	    });
		} else {
			res.status(401).send({"error": true, "message": req.auth_message});
		}
	})(req, res, next);
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
  res.redirect('/');
});

router.get('/tutor/:id', function (req, res, next) {
	api.get('tutor/' + req.params.id).then(result => {
		//console.log(result);
		tutor.loadProfile(req, res, next);
		//req.data = result.result;
		res.render('tutor_profile', {title: req.data.first_name + ' ' + req.data.last_name});
	}).catch(err => {
		console.log('caught error ' + err);
		return next(err);
	});
});

router.get('/settings', auth, function (req, res, next) {
	if(req.user.user_type == 'tutee') {
  	res.render('tutor_settings');
	} else if(req.user.user_type == 'tutee') {
		res.render('tutee_settings');
	}
});

router.get('/search' , function (req, res, next) {
	res.render('search', {
		title: 'Search',
		tutors: req.tutors
	});
});

module.exports = router;
