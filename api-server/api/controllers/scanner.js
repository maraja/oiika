var promise = require("bluebird");
var u = require('underscore');
var util = require('util');

var logger = require('../../logger');
var models = require('../../models');

var config = require('./config');
var utility = require('./utilities')
var helper = require('../helpers');

var sequelize = models.sequelize;


module.exports = {
    updateScanner: updateScanner,
    getScannerByScannerId: getScannerByScannerId
};

function updateScanner(req, res) {
    var params = req.swagger.params;
    var data = params.data.value;
    var carId = data.carId;
    var scannerId = data.scannerId;
    var isActive = data.isActive;
    var validationResult = undefined;
    var message = undefined;

    function doValidation() {
        var result = true;
        var message = undefined;
        if (!(typeof(carId) === "number" && typeof(scannerId) === "string")) {
            message = "both carId and scannerId must be provided";
            result = false;
        }
        else if (typeof(isActive) !== "boolean") {
            message = "isActive must be a boolean value";
            result = false;
        }

        return {
            result: result,
            message: message
        };
    }
    function doTransaction() {
        logger.verbose("updating activation state of scanner record of %s that was registered to car %s", scannerId, carId);
        return sequelize.transaction(function(t) {
            return models.scanner.update(
                {
                    is_active: isActive
                },
                {
                    where: {
                        scanner_id: scannerId,
                        id_car: carId
                    }
                },
                {
                    transaction: t
                }
            ).catch(function(error) {
                logger.verbose("cannot update activation state of scanner %s to %s", isActive, scannerId);
                return promise.reject(error);
            }).then(function(result) {
                result = result[0];

                if (result > 0) {
                    logger.verbose("# of scanner for car %s updated: %s", carId, result);
                    if (result > 1) {
                        logger.warn("more than 1 scanner updated for car %s", carId);
                    }
                    result = {
                        carId: carId,
                        scannerId: scannerId,
                        isActive: isActive
                    };
                }
                else {
                    if (!isActive) {
                        logger.verbose("no scanner updated but isActive is false, skipping");
                        result = {};
                    }
                    else {
                        logger.verbose("no scanner updated, attempt to create new scanner record");
                        result = models.scanner.update(
                            {
                                is_active: isActive
                            },
                            {
                                where: {
                                    id_car: carId,
                                    is_active: true
                                }
                            },
                            {
                                transaction: t
                            }
                        ).then(function(result) {
                            result = result[0];
                            logger.verbose("# of devices deactivated: %s", result);
                            logger.verbose("creating scanner %s for car %s", scannerId, carId);
                            return models.scanner.create({
                                scanner_id: scannerId,
                                id_car: carId,
                                is_active: true
                            }, {
                                transaction: t
                            });
                        }).then(function(result) {
                            result = result.dataValues;
                            logger.debug("scanner #%s created", result.id);

                            var newResult = {};
                            newResult.id = result.id;
                            newResult.carId = result.id_car;
                            newResult.scannerId = result.scanner_id;
                            newResult.isActive = result.is_active;
                            newResult.createdAt = result.created_at;
                            newResult.updatedAt = result.updated_at;
                            return newResult;
                        })
                    }

                }
                return result;
            })
        })
    }

    validationResult = doValidation();

    if (!validationResult.result) {
        throw helper.makeError("INVALID_INPUT", validationResult.message);
    }
    else {
        return doTransaction().catch(function(error) {
            logger.info("error when registering scanner %s to car %s", scannerId, carId);
            logger.info(util.format("%s: %s", error.name, error.message));
            if (error.name == "SequelizeUniqueConstraintError") {
                message = util.format("cannot register scanner %s to car %s. Either the car has active scanner, or the scanner was registered with another car", scannerId, carId);
            }
            else {
                message = "transaction rejected";
            }
            return promise.reject(helper.makeError("TRANSACTION_ERROR", message));
        }).then(function(result) {
            res.json(result);
        }).catch(function(error) {
            if (!error.nonce) {
                logger.warn("unexpected error when upserting scanner %s for car %s", scannerId, carId);
                logger.warn(error.stack);
                error = helper.makeError("TRANSACTION_ERROR", "internal service error");
            }
            helper.sendErrorResponse(res, error);
        })
    }
}

// TODO: follow the format in scan/pids controller in the future if someone wants to support getting scanner by id, etc.
function getScannerByScannerId(req, res) {
    var params = req.swagger.params;
    var scannerId = params.scannerId.value;
    var isActive = params.active.value;

    function doValidation() {
        // not validating isActive: done by swagger
        return new promise(function(resolve, reject) {
            if (!scannerId) {
                return reject(helper.makeError("INVALID_INPUT", "scannerId must be a non-empty string"))
            }

            return resolve();
        })

    }
    function doTransaction() {
        return models.scanner.findOne({
            attributes: [
                [ "id", "id" ],
                [ "scanner_id", "scannerId" ],
                [ "id_car", "carId" ]
            ],
            where: {
                scanner_id: scannerId,
                is_active: isActive
            }
        }).then(function(result) {
            if (result) { result = result.dataValues; }
            else { result = {}; }

            return result;
        })
    }

    return doValidation().then(function() {
        return doTransaction();
    }).then(function(result) {
        if (!u.isEmpty(result)) { logger.verbose("record found for scanner %s", scannerId); }
        else { logger.verbose("no record found for scanner %s", scannerId); }

        res.json(result);
    }).catch(function(error) {
        logger.verbose("error when getting scanner with scannerId %s", scannerId);
        if (!error.nonce) {
            logger.warn("unexpected error");
            logger.warn(error.stack);
            error = helper.makeError("TRANSACTION_ERROR", "internal service error");
        }
        else {
            logger.verbose("%s: %s", error.name, error.message);
        }

        return promise.reject(error);
    }).catch(function(error) {
        helper.sendErrorResponse(res, error);
    })
}
