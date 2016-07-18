'use strict';

var init = require('./init')();

var u = require('underscore');
var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
var bodyParser = require('body-parser');
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var handlers = require('./handlers');
var errorHandler = handlers.errorHandler;
var authHandler = handlers.authHandler;
var logger = require('./logger');
var config = require('config');
var jobs = require('./jobs');
var stub = require('./api/stub');

// var mongoUtil = require('./mongo/api/mongoUtil');

var secret = config.get('globalConfig.secrets');
var clientId = secret["clientId"];
var tokenSecretKey = secret["clientSecret"];

// var validate = require('./auth')["validate"];

// for testing
var chai = require('chai');
var jsonSchema = require('chai-json-schema');

var options = {
    env: config.get('globalConfig.environment')
};

chai.use(jsonSchema);
module.exports = app;

app.set('json spaces', 4);

app.use(function(req, res, next) {
    var validateToken = (
        (config.get('globalConfig.security.validation.enableDeviceVerification') &&
            (
                (config.get('globalConfig.environment') !== "test") ||
                (config.get('globalConfig.security.validation.enableDeviceVerificationInTestingEnv'))
            )
        )
    )
    if (validateToken) {
        var token = req.get('Client-Id');

        var validTokens = u.mapObject(secret.tokens, function(value, key) {
            return value;
        })

        if (!u.contains(validTokens, token)) {
            res.status(401);
            res.json({
                error: "UnauthorizedError",
                message: "invalid client id"
            });
        }
        else {
            next();
        }
    }
    else {
        next();
    }
})

app.use(function(req, res, next) {
    logger.debug(req.method + " " + req.url)
    next();
})

// minify response
// http://stackoverflow.com/questions/19833174/can-express-js-output-minified-json
app.set('json spaces', 0);

if (process.env.AUTH_ENABLE === "true") {
    app.use(authHandler.unless({
        path: [
            /\/login/i, // regex that matches all login paths
            /\/scan/i, // regex that matches all scan paths
            { url: '/user', methods: [ 'POST' ] } // allow login
        ]
    }))
}

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
app.use(function(err, req, res, next) {
    return errorHandler(err, req, res, next);
})

var swaggerOptions = {
    appRoot: __dirname // required config
        // swaggerSecurityHandlers: {
        //     expressJWT: validate
        // }
};

// mongoUtil.connectToServer( function( err ) { console.log(err); });

SwaggerExpress.create(swaggerOptions, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  // handling error in swaggerExpress scope
  app.use(function(err, req, res, next) {
      return errorHandler(err, req, res, next);
  })

  var port = process.env.PORT || 10010;
  if (options.env == "snapshot") {
      port = 10011;
  }
  else if (options.env == "staging") {
      port = 10010;
  }
  else if (options.env == "production") {
      port = 8081;
  }
  else if (options.env == "test") {
      port = 10012;
  }

  app.listen(port, function() {
      console.log("API server listening on port " + port);
  });
});
