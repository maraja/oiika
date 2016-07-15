var express = require('express');
var router = express.Router();

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

router.get('/search', function (req, res, next) {
  res.render('search', {title: 'Search'});
});

module.exports = router;
