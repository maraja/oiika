'use strict';

var u = require('underscore');
var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
var bodyParser = require('body-parser');
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var mongoDb = require('./mongo/helpers/mongodb');


// for testing
// var chai = require('chai');
// var jsonSchema = require('chai-json-schema');

// var options = {
//     env: config.get('globalConfig.environment')
// };

// chai.use(jsonSchema);
module.exports = app;

console.log("MongoDB connection: ");
console.log(mongoDb.dbConnection());

// app.set('json spaces', 4);

// app.use(function(req, res, next) {
//     logger.debug(req.method + " " + req.url)
//     next();
// })

// minify response
// http://stackoverflow.com/questions/19833174/can-express-js-output-minified-json
app.set('json spaces', 0);

app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401);
        res.json({
            error: err.name,
            message: err.message
        });
    }
    else {
        next(err);
    }
})

// error handling
// app.use(function(err, req, res, next) {
//     return errorHandler(err, req, res, next);
// })

var swaggerOptions = {
    appRoot: __dirname // required config
        // swaggerSecurityHandlers: {
        //     expressJWT: validate
        // }
};

// mongoUtil.connectToServer( function( err ) { console.log(err); });

SwaggerExpress.create(swaggerOptions, function(err, swaggerExpress) {
  // if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  // handling error in swaggerExpress scope
  // app.use(function(err, req, res, next) {
  //     return errorHandler(err, req, res, next);
  // })

  var port = process.env.PORT || 10010;
  // if (options.env == "snapshot") {
  //     port = 10011;
  // }
  // else if (options.env == "staging") {
  //     port = 10010;
  // }
  // else if (options.env == "production") {
  //     port = 8081;
  // }
  // else if (options.env == "test") {
  //     port = 10012;
  // }

  app.listen(port, function() {
      console.log("API server listening on port " + port);
  });
});
