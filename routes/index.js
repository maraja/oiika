var express = require('express');
var router = express.Router();
var mongoDb = require('../db/helpers/mongodb');

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

router.get('/search', [mongoDb.getAllTutors] , function (req, res, next) {
	res.render('search', {
		title: 'Search', 
		tutors: req.tutors
	});
});

module.exports = router;
