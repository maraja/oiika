'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};


var mongoDb = require('./mongo/helpers/mongodb');

console.log("MongoDB connection: ");
console.log(mongoDb.dbConnection());


SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  app.use(function(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    return next();
  });
  
  // install middleware
  swaggerExpress.register(app);

  var port = process.env.PORT || 10010;
  app.listen(port);
  console.log("API Server running on port " + port);

});
