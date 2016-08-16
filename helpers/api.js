var rp = require('request-promise');
var url = 'http://thehotspot.ca:10010/';

module.exports.get = function(path, middleware) {
  if(middleware) {
    //middleware request, append data to req
    return function(req, res, next) {
      rp({
    		uri: url + path,
    		method: "GET",
    		json: true
    	})
      .then(data => {
        req.data = data;
        next();
      })
      .catch(error => {
        req.data = "An internal error occurred. Please try again later.";
        next();
      });
    }
  } else {
    //non-middleware request, return a promise
    return rp({
  		uri: url + path,
  		method: "GET",
  		json: true
  	});
  }
}

module.exports.post = function(path, data, middleware) {
  if(middleware) {
    //middleware request, append data to req
    return function(req, res, next) {
      rp({
        uri: url + path,
        method: "POST",
        body: data,
        json: true
      }).then(data => {
        req.data = data;
        next();
      });
    }
  } else {
    //non-middleware request, return a promise
    return rp({
      uri: url + path,
      method: "POST",
      body: data,
      json: true
    });
  }
}

module.exports.put = function(path, data, middleware) {
  if(middleware) {
    //middleware request, append data to req
    return function(req, res, next) {
      rp({
        uri: url + path,
        method: "PUT",
        body: data,
        json: true
      }).then(data => {
        req.data = data;
        next();
      });
    }
  } else {
    //non-middleware request, return a promise
    return rp({
      uri: url + path,
      method: "PUT",
      body: data,
      json: true
    });
  }
}

module.exports.delete = function(path, middleware) {
  if(middleware) {
    //middleware request, append data to req
    return function(req, res, next) {
      rp({
    		uri: url + path,
    		method: "DELETE",
    		json: true
    	}).then(data => {
        req.data = data;
        next();
      });
    }
  } else {
    //non-middleware request, return a promise
    return rp({
  		uri: url + path,
  		method: "DELETE",
  		json: true
  	});
  }
}
