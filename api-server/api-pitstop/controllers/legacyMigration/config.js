var config = require('../../config');

var globalConfig = config.globalConfig;

config = config.userMigrationConfig;
config.globalConfig = globalConfig;

module.exports = config;
