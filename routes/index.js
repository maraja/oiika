var express = require('express');
var router = express.Router();
var passport = require('passport');

function auth(req, res, next) {
	console.log(req.isAuthenticated());
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/login');
}

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', {title: 'Home'});
});

// router.get('/login', function (req, res, next) {
// 	res.render('login', {title: 'Login'});
// });
//
// router.get('/signup', function (req, res, next) {
// 	res.render('signup', {title: 'Signup'});
// });

router.post('/login', passport.authenticate('local'), function (req, res, next) {
	res.redirect('/');
});

router.post('/signup', function (req, res, next) {
	res.send({"success": true});
});

router.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}), function(req, res) {});
router.get('/auth/facebook/callback', passport.authenticate('facebook', {
	successRedirect: '/',
	failureRedirect: '/'
}));

router.get('/auth/google', passport.authenticate('google', {scope: ['email profile'] }), function(req, res) {});
router.get('/auth/google/callback', passport.authenticate('google', {
	successRedirect: '/',
	failureRedirect: '/'
}));

router.get('/logout', function(req, res){
	console.log('logging out....');
  req.logout();
  res.redirect('/login');
});

router.get('/tutor/:id', function (req, res, next) {
  res.render('tutor_profile');
});

router.get('/tutor-settings', function (req, res, next) {
  res.render('tutor_settings');
});

router.get('/search' , function (req, res, next) {
	res.render('search', {
		title: 'Search',
		tutors: req.tutors
	});
});

module.exports = router;
