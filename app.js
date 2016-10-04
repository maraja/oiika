
var SwaggerExpress = require('swagger-express-mw');
var handlers = require('./handlers');
var config = require('./config');

var logger = require('./handlers/logger');
var cors = require('cors');

// declare app as a global variable (no var in front to hoist it to global scope)
// so that models and any other configuration can be used worldwide.
app = require('express')();

// hook all models into app. Instantiated only once.
app.models = {
  tutorModel: require('./api/models/Tutors')(),
  tuteeModel: require('./api/models/Tutees')(),
  scheduleModel: require('./api/models/Schedules')(),

  sessionModel: require('./api/models/Sessions')(),
  subjectModel: require('./api/models/Subjects')(),
  skillModel: require('./api/models/Skills')(),

  reviewModel: require('./api/models/Reviews')(),
  accountModel: require('./api/models/Accounts')()
};


switch (process.env.NODE_ENV){
  case 'unit-test':
    break;
  default:
    logger.debug("Overriding 'Express' logger");
    app.use(require('morgan')('combined', {stream: logger.stream}));
    break;
};



module.exports = app; // for testing

var swaggerConfig = {
  appRoot: __dirname // required config
};

// mongodb helper to connect to db
var mongoDb = require('./mongo/helpers/mongodb');
mongoDb.dbConnection();


// testing job
// require('./jobs/tutor-stats.js').calculateTutorStats();
var jobs = require('./jobs');
jobs.startAllJobs();

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

  // accept cross origin requests.
  app.use(cors());
  
  // install middleware
  swaggerExpress.register(app);

  var port = config.port;
  app.listen(port);
  console.log("API Server running on port " + port);

});
