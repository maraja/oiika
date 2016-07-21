var config = require('../../config');

var globalConfig = config.globalConfig;

config = config.adapterConfig;
config.globalConfig = globalConfig;

module.exports = config;
