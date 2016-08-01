
var SwaggerExpress = require('swagger-express-mw');

// declare app as a global variable (no var in front to hoist it to global scope)
// so that models and any other configuration can be used worldwide.
app = require('express')();

// hook all models into app. Instantiated only once.
app.models = {
  userModel: require('./api/models/Users')(),
  sessionModel: require('./api/models/Sessions')(),
  accountModel: require('./api/models/Accounts')()
}

module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

// mongodb helper to connect to db
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
