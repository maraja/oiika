'use strict';
var config    = require('config').get('globalConfig');
var u         = require('underscore');
var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var env       = config.environment;
var dbConfig  = config.secrets.db.userData;
var options   = {
    logging: false
};

u.extend(dbConfig, options);

var sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
var db        = {};

fs
  .readdirSync(path.join(__dirname, 'models'))
  .filter(function(file) {
    return (file.indexOf('./models') !== 0) && (file !== 'index.js');
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, 'models', file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
