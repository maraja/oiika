var mongoose = require("mongoose")
var fs = require("fs");
var path = require("path");
var config = require('../../config');
var promise = require('bluebird');

mongoose.Promise = promise;

var db = {};

if (config.globalConfig.environment !== "test" || config.authControllerConfig.legacyUserOptions.checkLegacyUserInTestEnv) {
    var dbConnection = mongoose.createConnection(config.globalConfig.secrets.parseDBConnectionString);

    fs
      .readdirSync(path.join(__dirname, 'models'))
      .filter(function(file) {
        return (file.indexOf('./models') !== 0) && (file !== 'index.js');
      })
      .forEach(function(file) {
        var model = require(path.join(__dirname, 'models', file));
        db[model.name] = dbConnection.model(model.name, model.schema, model.collection);
      });

    db.connection = dbConnection;
    console.log("MongoDB connection to Parse DB established.")
}

module.exports = db;
