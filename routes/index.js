var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/', function (req, res, next) {
  res.render('index', {title: 'Home'});
});

router.get('/search', function (req, res, next) {
  res.render('search', {title: 'Search'});
});

module.exports = router;
