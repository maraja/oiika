// Application entry-point

// Dependencies
var express = require('express'),
	jsdom = require('jsdom').jsdom,
	document = jsdom('<html></html>', {}),
	window = document.defaultView,
	$ = require('jquery')(window),
	stylus = require('stylus'),
	nib = require('nib');

var app = express();

function compile(str, path) {
	return stylus(str).set('filename', path).use(nib());
}

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// app.use(logger('dev'));
app.use('/scripts', express.static(__dirname + '/node_modules'));

app.use(stylus.middleware({
	src: __dirname + '/public',
	compile: compile
}));

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.render('index', {title: 'Home'});
});

app.get('/search', function (req, res) {
  res.render('search', {title: 'Search'});
});

app.listen(3000);