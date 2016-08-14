
var SwaggerExpress = require('swagger-express-mw');
var handlers = require('./handlers');
var config = require('./config');

// declare app as a global variable (no var in front to hoist it to global scope)
// so that models and any other configuration can be used worldwide.
app = require('express')();

// hook all models into app. Instantiated only once.
app.models = {
  tutorModel: require('./api/models/Tutors')(),
  tuteeModel: require('./api/models/Tutees')(),
  sessionModel: require('./api/models/Sessions')(),
  scheduleModel: require('./api/models/Schedules')(),

  tutorSessionModel: require('./api/models/TutorSessions')(),
  tuteeSessionModel: require('./api/models/TuteeSessions')(),

  reviewModel: require('./api/models/Reviews')(),
  accountModel: require('./api/models/Accounts')()
}

module.exports = app; // for testing

var swaggerConfig = {
  appRoot: __dirname // required config
};

// mongodb helper to connect to db
var mongoDb = require('./mongo/helpers/mongodb');
mongoDb.dbConnection();

// console.log("MongoDB connection: ");
// console.log(mongoDb.dbConnection());

// minify response
// http://stackoverflow.com/questions/19833174/can-express-js-output-minified-json
app.set('json spaces', 0);

if (process.env.AUTH_ENABLE === "true") {
    app.use(handlers.authHandler.unless({
        // paths that are allowed to be accessed without a valid jwt.
        path: config.unauthenticated_paths
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

app.set('json spaces', 4);

SwaggerExpress.create(swaggerConfig, function(err, swaggerExpress) {
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
