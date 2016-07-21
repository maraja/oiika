const util = require('util');
const promise = require("bluebird");
const u = require('underscore');
const request = require('request-promise');
const moment = require('moment');

const logger = require('../../logger');
const models = require('../../models');

const config = require('./config');
const utility = require('./utilities')
const helper = require('../helpers');

const getShopByIdMain = require('./shop').getShopByIdMain;

const sequelize = models.sequelize;

module.exports = {
    getCarById: getCarById,
    getCarByVinOrUser: getCarByVinOrUser,
    createCar: createCar,
    updateCar: updateCar
};

function createCar(req, res) {
    // shopId may be required in the future
    // required paramaters: userId, vin, baseMileage
    function doValidation() {
        // input validation
        var result = true;
        var message = undefined;
        // vin length is required to be 17(pre validation)
        if (vin.length !== 17) {
            message = "vin must be 17 digits";
            result = false;
        }
        else if ((typeof(userId) !== "number") || (userId < 0)) {
            message = "user id must be a valid non-negative number";
            result = false;
        }
        return {
            result: result,
            message: message
        }
    }
    function vinFormat(vin) {
        // vin has to be upper case, and I O and Q aren't allowed
        return vin.toUpperCase().replace(/I/g, "1").replace(/O/g, "0").replace(/Q/g, "0");
    }
    function getSpec(car) {
        logger.verbose("getting spec from mashape for car %s", vin);
        var options = {
            url: config.createCarOptions.mashapeAPI.getUrl(vin),
            method: config.createCarOptions.mashapeAPI.method,
            headers: config.createCarOptions.mashapeAPI.headers
        }

        return request(options).then(function(result) {
            result = JSON.parse(result);
            var message = undefined;
            logger.verbose('result from mashape when adding car %s: %s', vin, JSON.stringify(result));

            if (!result.success) {
                message = util.format("invalid vin %s", vin);
                logger.verbose(message);
                result = promise.reject(helper.makeError("INVALID_INPUT", message));
            }
            else {
                // NOTE: not processing raw data - is it proper behaviour?
                result = result.specification;
            }
            return result;
        }).catch(function(err) {
            if (!err.nonce) {
                logger.info("error when getting vehicle spec when creating car %s", vin);
                logger.info(err.stack);
                // return promise.reject(helper.makeError('TRANSACTION_ERROR', 'cannot validate vin'));
                return {}; // treated as nothing in spec
            }
            else {
                return promise.reject(err);
            }
        })
    }
    function doTransaction(car, spec) {
        logger.verbose("creating car %s", vin);
        return sequelize.transaction(function(t) {
            return models.car.create(
                {
                    vin: vin,
                    mileage_base: car.baseMileage,
                    mileage_total: car.baseMileage,
                    mileage_service: 0, // default
                    mileage_city: spec.city_mileage,
                    mileage_highway: spec.highway_mileage,
                    car_year: spec.year,
                    car_make: spec.make,
                    car_model: spec.model,
                    car_trim: spec.trim_level,
                    car_engine: spec.engine,
                    car_tank: spec.tank_size,
                    id_user: car.userId
                },
                {
                transaction: t
                }
            ).catch(function(err) {
                var message = undefined;
                if (err.name === "SequelizeUniqueConstraintError") {
                    var cause = u.find(err.errors, function(item) {
                        return item.type === "unique violation";
                    })
                    if (cause !== undefined) {
                        message = cause.path + " " + cause.value + " is already used";
                        logger.info("error when creating car: ", message);
                        err = helper.makeError("TRANSACTION_ERROR", message);
                    }
                }
                else if (err.name === "SequelizeForeignKeyConstraintError") {
                    message = util.format("userId %s does not exist", userId);
                    err = helper.makeError("INVALID_INPUT", message);
                }
                return promise.reject(err);
            }).then(function(newCar) {
                carId = newCar.id; // global variable update
                var promises = [];
                var scannerCreateEvent = null;
                var shopRelationCreateEvent = null;
                if (car.scannerId) {
                    logger.verbose("setting up relation for scanner %s and car %s", scannerId, newCar.id);
                    scannerCreateEvent = models.scanner.create(
                        {
                            scanner_id: car.scannerId,
                            is_active: true,
                            id_car: newCar.id
                        },
                        {
                            transaction: t
                        }
                    ).catch(function(err) {
                        if (err.name == "SequelizeUniqueConstraintError") {
                            err.message = util.format("scanner %s is already used and is still active", scannerId);
                        }
                        else {
                            err.message = util.format("cannot set up relation for car %s and scanner %s", newCar.id, scannerId);
                        }
                        return promise.reject(helper.makeError("INVALID_INPUT", err.message));
                    })
                }
                if (car.shopId) {
                    logger.verbose("setting up relation for shop %s and car %s", car.shopId, newCar.id);
                    shopRelationCreateEvent = models.car_shop.create(
                        {
                            id_shop: car.shopId,
                            id_car: newCar.id
                        },
                        {
                            transaction: t
                        }
                    ).catch(function(err) {
                        if (err.name === "SequelizeForeignKeyConstraintError") {
                            err.message = util.format("shopId %s does not exist", car.shopId);
                            logger.verbose("error when creating car: %s", err.message);
                            err = helper.makeError("TRANSACTION_ERROR", err.message);
                        }
                        return promise.reject(err);
                    })
                }

                return promise.all([
                    scannerCreateEvent,
                    shopRelationCreateEvent
                ]).catch(function(err) {
                    logger.verbose("error when creating car %s: %s", vin, err.message);
                    return promise.reject(err);
                });
            })
        }).then(function(result) {
            // NOTE: use getCarMain instead of formatting result.
            // might need to refactor this in the future
            var whereClause = { id: carId };
            return getCarMain(whereClause, true);
        }).catch(function(err) {
            if (!err.nonce) {
                logger.warn("unexpected error when creating car %s", vin);
                logger.warn(err.stack);
                err = helper.makeError("TRANSACTION_ERROR", "internal service error");
            }
            return promise.reject(err);
        })
    }
    function postCreate(result) {
        var carId = result.id;
        // TODO: move these two into a function

        var promises = [];
        var checkRecall = (
            (config.checkRecallsAfterCreation) &&
            (
                (config.globalConfig.environment !== "test") ||
                (config.globalConfig.environment === "test" && config.checkRecallsAfterCreationInTestingEnv)
            )
        );
        var checkEdmundsServices = (
            (config.checkEdmundsServicesAfterCreation) &&
            (
                (config.globalConfig.environment !== "test") ||
                (config.globalConfig.environment === "test" && config.checkEdmundsServicesAfterCreationInTestingEnv)
            )
        );

        if (checkRecall) {
            var checkRecallPromise = utility.checkRecallsByCarId(carId).catch(function(error) {
                if (!error.nonce) {
                    logger.info("error when updating recalls for car #%s", carId);
                    logger.info(error.stack);
                }
            });
            promises.push(checkRecallPromise);
        }
        if (checkEdmundsServices) {
            var checkEdmundsServicesPromise = utility.checkEdmundsServicesByCarId(carId).catch(function(error) {
                if (!error.nonce) {
                    logger.info("error when updating edmunds services for car #%s", carId);
                    logger.info(error.stack);
                }
            });
            promises.push(checkEdmundsServicesPromise);
        }

        promise.all(promises).then(function() {
            return utility.serviceUpdateByCarId(carId);
        }).catch(function(error) {
            if (!error.nonce) {
                logger.info("error when updating services for car #%s:", carId);
                logger.info(error.stack);
            }
        })
    }

    var params = req.swagger.params;
    var car = params.car.value;
    var vin = car.vin;
    var userId = car.userId;
    var shopId = car.shopId;
    var scannerId = car.scannerId;
    var carId = undefined;

    // base mileage cant be lower than 0
    if (car.baseMileage < 0) {
        car.baseMileage = 0;
    }

    var validationResult = doValidation();

    if (!validationResult.result) {
        logger.verbose("input validation failed when creating car %s", vin)
        throw helper.makeError("INVALID_INPUT", validationResult.message);
    }
    else {
        vin = vinFormat(vin);
        return getSpec(car).then(function(spec) {
            return doTransaction(car, spec).then(function(result) {
                res.json(result);
                postCreate(result);
            })
        }).catch(function(err) {
            return helper.sendErrorResponse(res, err);
        })
    }

}

function updateCar(req, res) {
    // update mileage or shopId at this moment
    // NOTE: owner of car can be updated
    var params = req.swagger.params;
    var car = params.car.value;

    var doValidation = function() {
        var result = true;
        // base mileage cant be lower than 0
        if (!car.shopId && !car.totalMileage) {
            throw(helper.makeError("INVALID_INPUT", "please enter totalMileage or shopId"));
            result = false;
        }
        if (car.shopId && car.totalMileage) {
            throw(helper.makeError("INVALID_INPUT", "please put totalMileage or shopId, not both"));
            result = false;
        }

        if (car.totalMileage && car.totalMileage <= 0) {
            throw(helper.makeError("INVALID_INPUT", "please enter a positive totalMileage"));
            result = false;
        }

        if (car.shopId && car.shopId <= 0) {
            throw(helper.makeError("INVALID_INPUT", "please enter a positive shopID"));
            result = false;
        }
        return result;
    }

    function doTransaction(car) {
        // NOTE: promise chain can be broken into 2 querys for optimization
        return sequelize.transaction(function(t) {
            if (car.totalMileage) { // updating mileage
                return models.car.update({
                    mileage_total: car.totalMileage
                }, {
                    where: {
                        id: car.carId
                    }
                }, {
                    transaction: t
                }).then(function(rowsAffected) {
                    // not using "===": result would either be "[ 0 ]" or "[ 1 ]" as in console.log,
                    // type is "object" but there is no details about that is being returned
                    // ref: https://github.com/sequelize/sequelize/pull/1293
                    if (rowsAffected == 0) {
                        message = "car not found";
                        logger.info("error in updateCar: ", "no records affected in db");
                        return promise.reject(helper.makeError("TRANSACTION_ERROR", message));
                    }
                    else {
                        var newCar = {};
                        newCar.totalMileage = car.totalMileage;
                        newCar.carId = car.carId;
                        return newCar;
                    }
                });
            }
            else if (car.shopId) { // updating shop
                return models.car_shop.destroy({
                    where: {
                        id_car: car.carId
                    }
                }, {
                    transaction: t
                }).then(function() {
                    return promise.try(function() {
                        return models.car_shop.create({
                            id_shop: car.shopId,
                            id_car: car.carId
                        }, {
                            transaction: t
                        });
                    });
                });
            }
            else {
                return promise.reject(helper.makeError("TRANSACTION_ERROR", "invalid input: missing both totalMileage and shopId"));
            }
        })
    }
    if (doValidation()) {
        doTransaction(car).then(function(result1) {
            // TODO: return readable details in here
            logger.debug("car #%s updated", car.carId);
            if (typeof(car.shopId) !== "undefined") {
                // NOTE: why get it from query - should be available in car object
                return getShopByIdMain(car.shopId).then(function(shop) {
                    var result = {};
                    result.carId = car.carId;
                    result.shop = shop;
                    return result;
                })
            }
            else {
                return result1;
            }

        }).then(function(result) {
            res.json(result);

        }).catch(function (error) {
            if (error.name === "SequelizeForeignKeyConstraintError") {
                message = "id doesn't exist. Check the input";
                logger.info("error when creating car: ", message);
                error = helper.makeError("TRANSACTION_ERROR", message);
            }
            if (error.name === "SequelizeUniqueConstraintError") {
                var cause = u.find(error.errors, function (item) {
                    return item.type === "unique violation";
                })
                if (cause !== undefined) {
                    message = cause.path + " " + cause.value + " is already used";
                    logger.info("error when updating car: ", message);
                    error = helper.makeError("TRANSACTION_ERROR", message);
                }
            }

            return promise.reject(error);

        }).catch(function(error) {
            if (!error.nonce) {
                message = "internal db error";
                logger.warn("error when updating car: ", "unexpected error");
                logger.warn(error);
                error = helper.makeError("TRANSACTION_ERROR", message);
            }

            helper.sendErrorResponse(res, error);
        }).then(function() {
            // meta update
            logger.verbose("updating meta data of car %s", car.carId)

            return models.car.findOne({ where: { id: car.carId } });
        }).then(function(carObject) {
            carObject = carObject.dataValues;
            var meta = carObject.meta || {};
            meta = u.extend(meta, { lastManualMileageUpdateAt: moment() });
            logger.debug("lastManualMileageUpdateAt:",
                meta.lastManualMileageUpdateAt.format('MMMM Do YYYY, h:mm:ss a')
            );
            return models.car.update(
                {
                    meta: meta
                }, {
                    where: {
                        id: carObject.id
                    }
                }
            );
        }).then(function() {
            logger.verbose("meta data of car %s updated", car.carId);
        }).catch(function(error) {
            logger.info("error when updating meta data of car %s", car.carId);
            logger.info(error.stack);
        })
    }
}

var getCarMain = function(whereClause, getFirst) {
    // NOTE: getFirst is a boolean indicating whether the result should be the first car found or all cars
    return models.car.findAll({
        // TODO: frontend only need to know number of cars with givin VIN but not the details
        attributes: [
            ["id", "id"],
            ["vin", "vin"],
            ["car_year", "year"],
            ["car_make", "make"],
            ["car_model", "model"],
            ["car_trim", "trim"],
            ["car_engine", "engine"],
            ["car_tank", "tankSize"],
            ["id_user", "userId"],
            ["mileage_city", "cityMileage"],
            ["mileage_highway", "highwayMileage"],
            ["mileage_base", "baseMileage"],
            ["mileage_total", "totalMileage"]
        ],
        include: [{
            model: models.car_shop,
            required: false,
            include: [{
                model: models.shop,
                attributes: [
                    ["id", "id"],
                    ["name", "name"],
                    ["address", "address"],
                    ["latitude", "latitude"],
                    ["longitude", "longitude"],
                    ["phone_number", "phone"],
                    ["email", "email"]
                ]
            }]
        }, {
            model: models.scanner,
            required: false,
            attributes: [
                ["id", "id"],
                ["scanner_id", "scannerId"]
            ],
            where: {
                is_active: true
            }
        }, {
            model: models.car_service,
            required: false,
            as: "issues",
            attributes: [
                ["id", "id"],
                ["status", "status"],
                ["done_at", "doneAt"],
                ["priority", "priority"],
                // these 4 cols are for internal data processing, shoudl change the way how things work
                "id_service_edmunds",
                "id_service_customized",
                "id_recall_recallmasters",
                "id_service_archive",
                "id_dtc", ["dtc_is_pending", "isPending"]
            ],
            include: [
                //TODO: include service_types, clean up the data from there
                {
                    model: models.service_edmunds,
                    attributes: [
                        ["id", "edmundsServiceId"]
                    ],
                    include: [{
                        model: models.service_edmunds_approved,
                        attributes: [
                            ["item", "item"],
                            ["action", "action"],
                            ["description", "description"],
                            ["priority", "priority"]
                        ]
                    }]
                }, {
                    model: models.service_customized,
                    attributes: [
                        ["item", "item"],
                        ["description", "description"],
                        ["priority", "priority"],
                        ["action", "action"]
                    ]
                }, {
                    model: models.service_archive,
                    attributes: [
                        ["item", "item"],
                        ["action", "action"],
                        ["description", "description"],
                        ["details", "details"]
                    ]
                }, {
                    model: models.recall_recallmasters,
                    attributes: [
                        ["name", "item"],
                        ["description", "description"]
                    ]
                }, {
                    model: models.dtc,
                    attributes: [
                        ["dtc_code", "item"],
                        ["description", "description"]
                    ]
                }
            ]
        }],
        where: whereClause
    }).then(function(data) {
        logger.debug("number of objects found: %s", data.length);
        var currIssue = null;
        var currItem = null;

        // reformat the returned data to match expected output

        for (var i = 0; i < data.length; i++) {
            // data pre-process
            currItem = data[i].dataValues;

            if (currItem.car_shop) {
                currItem.shop = currItem.car_shop.dataValues.shop.dataValues;
            }
            else {
                currItem.shop = null;
            }

            currItem.car_shop = undefined;
            if (!currItem.scanner.length) {
                currItem.scanner = null;
            }
            else {
                currItem.scanner = currItem.scanner[0].dataValues; // only use the first scanner
            }

            var carId = currItem.id;

            logger.debug("# of issues found for car %s: %s", carId, currItem.issues.length);

            for (var j = 0; j < currItem.issues.length; j++) {
                currIssue = currItem.issues[j].dataValues;
                if (currIssue.id_service_edmunds) {
                    // NOTE: using details of approved services instead of those in edmunds service
                    currIssue.issueDetail = currIssue.service_edmunds.dataValues.service_edmunds_approved.dataValues;
                    currIssue.issueType = "service_edmunds";
                    // NOTE: use priority in edmunds services or customized services
                    currIssue.priority = currIssue.issueDetail.priority;
                    delete(currIssue.issueDetail.priority);
                }
                else if (currIssue.id_service_customized) {
                    currIssue.issueDetail = currIssue.service_customized.dataValues;
                    currIssue.issueType = "service_customized";
                    // NOTE: use priority in edmunds services or customized services
                    currIssue.priority = currIssue.issueDetail.priority;
                    delete(currIssue.issueDetail.priority);
                }
                else if (currIssue.id_service_archive) {
                    currIssue.issueDetail = currIssue.service_archive.dataValues;
                    currIssue.issueType = "service_archive";
                }
                else if (currIssue.id_recall_recallmasters) {
                    currIssue.issueDetail = currIssue.recall_recallmasters.dataValues;
                    currIssue.issueType = "recall_recallmasters";
                }
                else if (currIssue.id_dtc) {
                    currIssue.issueDetail = currIssue.dtc.dataValues;
                    currIssue.dtc.dataValues.isPending = currIssue.isPending
                    currIssue.issueType = "dtc";
                }
                else {
                    logger.warn("no valid issue type found in issue %s", currIssue.id);
                    currIssue = undefined;
                }

                if (currIssue) {
                    currIssue.id_service_edmunds = undefined;
                    currIssue.id_service_customized = undefined;
                    currIssue.id_service_archive = undefined;
                    currIssue.id_recall_recallmasters = undefined;
                    currIssue.id_dtc = undefined;

                    currIssue.service_edmunds = undefined;
                    currIssue.service_customized = undefined;
                    currIssue.recall_recallmasters = undefined;
                    currIssue.service_archive = undefined;
                    currIssue.dtc = undefined;

                    currIssue.id_service_type = undefined;
                    currIssue.id_car = undefined;
                    currIssue.issueDetail.id = undefined;
                }

                delete(currIssue.isPending);

                currItem.issues[j] = currIssue;
            }

            // order issues by id
            currItem.issues = u.sortBy(currItem.issues, function(object) {
                return object.id
            });
            if (currItem.issues.length === 0) {
                currItem.issues = null;
            }

            // enforce return type
            currItem.baseMileage = Number(currItem.baseMileage);
            currItem.totalMileage = Number(currItem.totalMileage);

            data[i] = currItem;
        }

        // id is a unique identifier
        if (data.length === 0) {
            data = {};
        }
        else {
            if (getFirst) {
                data = data[0];
            }
        }

        return data;
    })
}

function getCarById(request, response) {
    var params = request.swagger.params;
    var carId = params.carId.value; // e.g. 123
    var whereClause = {
        id: carId
    };

    // input validation
    if (carId < 0) {
        throw helper.makeError("INVALID_INPUT", "carId must be non-negative");
    }

    logger.debug('getting car with id: %s', carId);

    return getCarMain(whereClause, true).then(function(result) {
        response.json(result);
    }).catch(function(error) {
        logger.warn("error in getCarById:");
        logger.warn(error.stack);
        helper.sendErrorResponse(response, helper.makeError("TRANSACTION_ERROR", "internal service error"));
    })
}

function getCarByVinOrUser(request, response) {
    var params = request.swagger.params;
    var vin = params.vin.value; // e.g. "3C3CFFBR4DT562443"
    var userId = params.userId.value; // e.g. 123
    var getFirst = undefined;
    var whereClause = sequelize.or({
        vin: vin
    }, {
        id_user: userId
    })

    // validation
    // TODO validation should be wrapped into a function
    if (!vin && !userId) {
        throw (helper.makeError("INVALID_INPUT", "no parameter provided"));
    }
    else if (vin && userId) {
        throw (helper.makeError("INVALID_INPUT", "only one parameter is allowed"));
    }
    else if (vin && vin.length !== 17) {
        throw (helper.makeError("INVALID_INPUT", "vin must be 17 chars"));
    }
    else if (userId && userId < 0) {
        throw (helper.makeError("INVALID_INPUT", "userId must be non-negative"));
    }

    if (typeof(vin) === "string") {
        vin = vin.toUpperCase();
    }

    if (vin) {
        getFirst = true;
    }
    else {
        getFirst = false;
    }

    return getCarMain(whereClause, getFirst).then(function(result) {
        response.json(result);
    }).catch(function(error) {
        logger.warn("error in getCarById:");
        logger.warn(error.stack);
        helper.sendErrorResponse(response, helper.makeError("TRANSACTION_ERROR", "internal service error"));
    })
}
