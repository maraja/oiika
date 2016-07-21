var config = require('../../config');

var globalConfig = config.globalConfig;

config = config.authControllerConfig;
config.globalConfig = globalConfig;

module.exports = config;
