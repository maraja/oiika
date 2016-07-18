var u = require('underscore');
var promise = require('bluebird');

var get = require('./get');
var save = require('./save');
var setRelation = require('./setRelation');
var controllers = require('./controllers');

var util = require('util');

var logger = controllers.logger;
var models = controllers.sequelizeModels;

var totalSteps = 11;

module.exports = doMigration;

function logStatus(currStep, userId, message) {
    logger.info("step %s/%s of migration for user %s: %s", currStep, totalSteps, userId, message);
}
function migrationStateUpdate(userId, newState) {
    var userId = userId;
    var newState = newState;
    // NOTE: no state validation at this moment
    return models.user.update(
        { migration_state: newState },
        { where: { id: userId }}
    ).then(function() {
        logger.verbose("migration state of user %s updated to %s", userId, newState);
    }).catch(function(err) {
        logger.info("error when updating migration state of user %s:", userId);
        logger.info(err.stack);
    })
}

function doMigration(userId, parseObjectId) {
    function init(userId) {
        return promise.resolve();
    }
    function getData(userId, parseObjectId) {
        var result = {};
        logStatus(1, userId, "get user data");
        return get.getUser(parseObjectId).then(function(userObject) {
            result.user = userObject;
            var userObjectId = userObject._id;
            logger.debug("userObjectId found: %s", userObjectId)
            logStatus(2, userId, "get car data");
            return get.getCars(userObjectId);
        }).then(function(carObjects) {
            logStatus(3, userId, "get active recalls and service hisotry");
            var promises = [];
            var currCarObject = undefined;
            var currCarDetails = undefined;

            for (var i = 0 ; i < carObjects.length; i++) {
                result.cars = carObjects; // add carObjects to result
                // item in each promise:
                // [ <carObjectId>, <activeRecalls>, <serviceHistory> ]
                currCarObject = carObjects[i];

                currCarDetails =  [
                    currCarObject.carObjectId,
                    get.getActiveRecalls(currCarObject.carObjectId),
                    get.getServiceHistory(currCarObject.carObjectId)
                ]

                promises.push(promise.all(currCarDetails).then(function(result) {
                    return {
                        carObjectId: result[0],
                        activeRecalls: result[1],
                        serviceHistory: result[2]
                    }
                }))
            }

            return promise.all(promises);

        }).then(function(results) {
            logStatus(4, userId, "add active recall info and service history to results");

            result.cars = u.map(result.cars, function(item) {
                return u.extend(item, u.findWhere(results, { carObjectId: item.carObjectId }))
            })
            return;

        }).then(function() {
            logStatus(5, userId, "get all shops from Parse");
            return get.getShops().then(function(shops) { result.shops = shops; });
        }).then(function() {
            result = JSON.parse(JSON.stringify(result)); // remove restrictions on mongoose query result
            result.user.newId = userId;
            return result;
        })
    }
    function saveData(data) {
        var data = data;
        logStatus(6, userId, "save cars");
        return save.saveCars(data).then(function() {
            logStatus(7, userId, "retrieve servies");
            return save.updateServices(data);
        }).then(function() {
            logStatus(8, userId, "update service history");
            return save.saveServiceHistory(data);
        }).then(function() {
            logStatus(9, userId, "save active services");
            return save.saveActiveServices(data);
        })
        return promise.resolve();
    }
    function setRelations(data) {
        logStatus(10, userId, "set relations of cars and shops");
        return setRelation.setCarShopRelations(data)
        .then(function() {
            logStatus(11, userId, "set relation of first car");
            return setRelation.setSettings(data);
        })
    }
    function postMigration(userId) {
        return promise.resolve();
    }

    logger.info("migration for user %s start", userId);
    var data = undefined;
    migrationStateUpdate(userId, "init");
    return init(userId).then(function() {
        return migrationStateUpdate(userId, "get_data");
    }).then(function() {
        return getData(userId, parseObjectId);
    }).then(function(result) {
        data = result;
        // logger.info("data retrieved from Parse");
        // console.log(JSON.stringify(result))
        return;
    }).then(function() {
        return migrationStateUpdate(userId, "save_data");
    }).then(function() {
        return saveData(data);
    }).then(function() {
        return migrationStateUpdate(userId, "set_relation");
    }).then(function() {
        return setRelations(data);
    }).then(function() {
        // console.log(util.inspect(data, {
        //     "depth": null,
        //     "colors": true
        // }))
        // console.log(JSON.stringify(data));
    }).then(function() {
        migrationStateUpdate(userId, "done");  // no need to put it in promise chain
        return postMigration(userId);
    }).then(function() {
        logger.info("migration for user %s complete", userId);
    }).catch(function(error) {
        logger.info("error in migration for user %s", userId);
        logger.info(error.stack);
        migrationStateUpdate(userId, "failed");
    })
}

// doMigration(1, "4lIEFlG9Kn");
