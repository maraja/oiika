var u = require('underscore');
var util = require('util');
var promise = require('bluebird')

var controllers = require('./controllers');

var logger = controllers.logger;
var helper = controllers.helper;
var ParseModels = controllers.models;
var SequelizeModels = controllers.sequelizeModels;

var stub = require('./stub').json;

module.exports = {
    setCarShopRelations: setCarShopRelations,
    setSettings: setSettings
};

function setCarShopRelations(data) {
    function getPayloads(cars) {
        var result = u.map(cars, function(car) {
            var carId = car.basicInfo.id;
            var shopId = undefined;
            var result = undefined;
            try {
                shopId = car.shop.id;
            }
            catch (err) {
                logger.verbose(util.format("%s: %s", err.name, err.message));
                logger.verbose("cannot get shop for car %s, skipping", carId);
            }
            if (typeof(shopId) !== "number") {
                result = null;
            }
            else {
                result = {
                    id_car: carId,
                    id_shop: shopId
                }
            }
            return result;
        });

        return u.filter(result, function(item) {
            return (!!item); // remove null or undefined item
        })
    }
    function doSave(payloads) {
        // for log purpose only
        u.each(payloads, function(payload) {
            logger.debug("assigning shop %s to car %s", payload.id_shop, payload.id_car);
        })

        return SequelizeModels.car_shop.bulkCreate(payloads).then(function(result) {
            logger.verbose("%s car shop relations updated for user %s", result.length, userId);
        })
    }

    // console.log(data.shops)
    var userId = data.user.newId;
    return doSave(getPayloads(data.cars));

    // getShops().then(function(result) { console.log(result); })
}
function setSettings(data) {
    function getFirstCar(cars) {
        var isCurrCarFound = false;
        var currCarId = undefined;
        var currCar = undefined;
        for (var i = 0; i < cars.length && !isCurrCarFound; i++) {
            currCar = cars[i];
            logger.debug("firstCar of car %s: %s", currCar.basicInfo.id, currCar.relations.currentCar);
            if (currCar.relations.currentCar) {
                isCurrCarFound = true;
                currCarId = currCar.basicInfo.id;
            }
        }
        return currCarId;
    }
    function getSettings(userId) {
        return SequelizeModels.settings.findOne({
            where: { id_user: userId }
        }).then(function(result) {
            if (result && !u.isEmpty(result.settings)) {
                result = result.dataValues;
            }
            return result;
        })
    }

    var userId = data.user.newId;
    var cars = data.cars;

    logger.debug("getting settings from for user %s", userId);
    return getSettings(userId).then(function(settingsObject) {
        var firstCar = getFirstCar(cars);
        var result = undefined;
        var currSettings = undefined;

        var userHasSetings = (settingsObject && (!!settingsObject) && (!u.isEmpty(settingsObject.settings)));

        if (!userHasSetings) {
            logger.verbose("user %s has no settings, creating new one", userId);
            result = { id_user: userId };
            currSettings = {};
        }
        else {
            result = settingsObject;
        }

        currSettings = u.extend(currSettings, { firstCar: firstCar });
        result.settings = currSettings;

        logger.verbose("settings for user %s: %s", userId, JSON.stringify(result));

        return {
            settingsObject: result,
            userHasSetings: userHasSetings
        };
    }).then(function(result) {
        if (result.userHasSetings) {
            return SequelizeModels.settings.update(
                result.settingsObject,
                { where: {id_user: userId } }
            );
        }
        else {
            return SequelizeModels.settings.create(result.settingsObject);
        }
    })
}

// setSettings(stub)
