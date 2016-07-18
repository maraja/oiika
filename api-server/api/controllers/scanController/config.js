var config = require('../../config');

var globalConfig = config.globalConfig;

config = config.scanControllerConfig;
config.globalConfig = globalConfig;

module.exports = config;
