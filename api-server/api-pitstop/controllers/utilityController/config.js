var config = require('../../config');

var globalConfig = config.globalConfig;

config = config.utilityControllerConfig;
config.globalConfig = globalConfig;

module.exports = config;
