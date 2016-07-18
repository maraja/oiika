var promise = require('bluebird');
var u = require('underscore');

var controllers = require('./controllers');

var logger = controllers.logger;
var helper = controllers.helper;
var models = controllers.models;

module.exports = {
    
};

function userMigration(userId, parseObjectId) {
    function getUserFromParse(userId, parseObjectId) {
        return models.user.findOne({
            _id: parseObjectId
        })
    }
    function basicUserInfoMigration(userId, userdata) {
        // for now basic info is migrated in legacy auth process
        return promise.resolve();
    }
    function settingsMigration(userId, settings) {
        var settings = {
            firstCar: userdata.firstCar
        };

        if (!!settings) {
            logger.debug("user %s has no settings", userId);
            return promise.resolve();
        }
        else {
            return controllers.userController.updateUserSettingsMain(userId, settings);
        }
    }

    logger.debug("getting user info from Parse for user %s", userId);

    return getUserFromParse(userId, parseObjectId).then(function(userdata) {
        logger.debug("user info found from Parse for user %s", userId);
        logger.debug("migrating basic user info and settings for user %s", userId);
        var promises = [
            basicUserInfoMigration(userId, userdata),
            settingsMigration(userId, userdata)
        ]

        return promise.all(promises).then(function() {
            logger.info("user info for user %s migrated", userId);
            return;
        })
    })
}
