const u = require('underscore');
const promise = require('bluebird');
const util = require('util');
const request = require('request');

var logger = require('../../../logger');
var models = require('../../../models');
var helper = require('../../helpers');
var config = require('./config');

var sequelize = models.sequelize;
var options = config.recallMastersOptions;


var getVinByCarId = function(carId) {
    // validation
    var doValidation = function() {
        return new promise(function(resolve, reject) {
            if (typeof(carId) === "number" && carId >= 0) {
                return resolve(true);
            }
            else {
                return reject(helper.makeError("INVALID_INPUT", "carId must be non-negative"));

            }
        })
    }

    var doQuery = function() {
        return models.car.findOne({
            attributes: [
                "id", "id",
                "vin", "vin"
            ],
            where: {
                id: carId
            }
        }).then(function(result) {
            if (typeof(result) === "object" && result && typeof(result.dataValues) === "object" && typeof(result.dataValues.vin) === "string") {
                return result.dataValues.vin;
            }
            else {
                logger.info("in getVinByCarId:", "vin not found for car #" + carId)
                return promise.reject(helper.makeError("TRANSACTION_ERROR", "VIN not found"));
            }
        }).catch(function(error) {
            if (!error.nonce) {
                logger.warn("error in getVinByCarId: ", error.name, error.message);
                logger.warn(error.stack);
                error = helper.makeError("TRANSACTION_ERROR", "internal service error");
            }

            return promise.reject(error);
        })
    }

    return doValidation().then(function() {
        return doQuery();
    })
}

var getCarByCarId = function(carId) {
    // validation
    var doValidation = function() {
        return new promise(function(resolve, reject) {
            if (typeof(carId) === "number" && carId >= 0) {
                return resolve(true);
            }
            else {
                return reject(helper.makeError("INVALID_INPUT", "carId must be non-negative"));

            }
        })
    }

    var doQuery = function() {
        return models.car.findOne({
            attributes: [
                ["id", "id"],
                ["vin", "vin"],
                ["mileage", "mileage"]

            ],
            where: {
                id: carId
            }
        }).then(function(result) {
            if (typeof(result) === "object" && result && typeof(result.dataValues) === "object" && typeof(result.dataValues.vin) === "string") {
                return result.dataValues;
            }
            else {
                logger.info("in getVinByCarId:", "vin not found for car #" + carId)
                return promise.reject(helper.makeError("TRANSACTION_ERROR", "VIN not found"));
            }
        }).catch(function(error) {
            if (!error.nonce) {
                logger.warn("error in getVinByCarId: ", error.name, error.message);
                logger.warn(error.stack);
                error = helper.makeError("TRANSACTION_ERROR", "internal service error");
            }

            return promise.reject(error);
        })
    }

    return doValidation().then(function() {
        return doQuery();
    })
}


module.exports = {
    getVinByCarId: getVinByCarId,
    getCarByCarId: getCarByCarId
}
