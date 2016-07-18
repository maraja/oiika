var config = require('../config');

var globalConfig = config.globalConfig;

config = config.coreControllerConfig;
config.globalConfig = globalConfig;

module.exports = config;
