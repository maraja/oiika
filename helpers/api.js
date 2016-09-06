var rp = require('request-promise');
var url = 'http://thehotspot.ca:10010/';
var api_key = 'oiika.r902rl7ldpe4pT3168P9fe7Z0YmItx80';

module.exports.get = function(path, middleware) {
  if(middleware) {
    //middleware request, append data to req
    return function(req, res, next) {
      rp({
    		uri: url + path,
    		method: "GET",
        headers: {
          "x-oiika-api": api_key
        },
    		json: true
    	})
      .then(data => {
        req.data = data;
        return next();
      })
      .catch(error => {
        req.data = "An internal error occurred. Please try again later.";
        return next();
      });
    }
  } else {
    //non-middleware request, return a promise
    return rp({
  		uri: url + path,
  		method: "GET",
      headers: {
        "x-oiika-api": api_key
      },
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
        headers: {
          "x-oiika-api": api_key
        },
        body: data,
        json: true
      }).then(data => {
        req.data = data;
        return next();
      });
    }
  } else {
    //non-middleware request, return a promise
    return rp({
      uri: url + path,
      method: "POST",
      headers: {
        "x-oiika-api": api_key
      },
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
        headers: {
          "x-oiika-api": api_key
        },
        body: data,
        json: true
      }).then(data => {
        req.data = data;
        return next();
      });
    }
  } else {
    //non-middleware request, return a promise
    return rp({
      uri: url + path,
      method: "PUT",
      headers: {
        "x-oiika-api": api_key
      },
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
        headers: {
          "x-oiika-api": api_key
        },
    		json: true
    	}).then(data => {
        req.data = data;
        return next();
      });
    }
  } else {
    //non-middleware request, return a promise
    return rp({
  		uri: url + path,
  		method: "DELETE",
      headers: {
        "x-oiika-api": api_key
      },
  		json: true
  	});
  }
}
