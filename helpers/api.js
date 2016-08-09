var rp = require('request-promise');

module.exports.get = function(url) {
  return rp({
		uri: url,
		method: "GET",
		json: true
	});
}

module.exports.post = function(url, body) {
  return rp({
		uri: url,
		method: "POST",
		body: body,
		json: true
	});
}
