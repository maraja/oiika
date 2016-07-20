var express = require('express');
var router = express.Router();
var mongoDb = require('../db/helpers/mongodb');
var passport = require('passport');

var db = mongoDb.dbConnection();


/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', {title: 'Home'});
});

router.get('/login', function (req, res, next) {
	res.render('login', {title: 'Login'});
});

router.get('/signup', function (req, res, next) {
	res.render('signup', {title: 'Signup'});
});

router.get('/auth/facebook', passport.authenticate('facebook'), function(req, res) {});
router.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
  res.redirect('/account');
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login');
});

router.get('/account', [ensureAuthenticated] , function (req, res, next) {
  res.render('account', { user: req.user });
});

router.get('/search', [mongoDb.getAllTutors] , function (req, res, next) {
	res.render('search', {
		title: 'Search',
		tutors: req.tutors
	});
});

// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

module.exports = router;
