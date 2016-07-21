var path = require('path');
var config = require('./config');

var templates = require(path.join(config.globalConfig.paths.basePath, 'asset'));
var helpers = require(path.join(config.globalConfig.paths.basePath, 'api', 'helpers'));
var models = require(path.join(config.globalConfig.paths.basePath, 'models'));
var logger = require(path.join(config.globalConfig.paths.basePath, 'logger'));

var Parse = require('parse/node').Parse;
let javascriptKey = config.pushNotificationOptions.javascriptKey;
let appKey = config.pushNotificationOptions.appKey;

Parse.initialize(appKey, javascriptKey);

module.exports = {
    templates: templates,
    models: models,
    helpers: helpers,
    logger: logger,
    Parse: Parse
}
