const u = require('underscore');
const promise = require('bluebird');
const util = require('util');
const validator = require('jsonschema').validate;

const logger = require('../../../logger');
const models = require('../../../models');
const helper = require('../../helpers');
const config = require('./config');

const sequelize = models.sequelize;

let tripController = require('./trip');
let pidArraySchema = config.pids.pidArraySchema;

function getConvertedPids(PIDArray, scannerId) {
    logger.verbose("converting %s pid data points for scanner %s", PIDArray.length, scannerId);
    // pid array is a loop of pid timestamps
    // ex; Pidarray: [[pids:[id: 210d, data: 0000, id:210c, data:FF0s0], timestamp:unixtime], [pids:....]]
    return promise.all(
        u.map(PIDArray, function(dataPoint) {
            return new promise(function(resolve, reject) {
                dataPoint.pids = u.map(dataPoint.pids, function(pid) {
                    var id = pid.id;
                    var data = pid.data;
                    var result = undefined;

                    try {
                        if (data) {
                            // device occasionally dumps repeated data as a large object, so delete that
                            // ex: 1...2....3...4...5...(1,2,3,4,5)
                            if (typeof(data) === "string" && data.indexOf(',') !== -1) {
                                return null;
                            }

                            // the first 2 hex bytes as int
                            var x2 = parseInt(data.substring(0, 2), 16);
                            var x1 = 0;
                            if (data.length > 2) {
                                // the second 2 hex bytes as int
                                x1 = parseInt(data.substring(2, 4), 16);
                            }
                            // overall hex as int
                            data = parseInt(data, 16);

                            // see specs for more info on these conversion functions
                            switch (id) {
                                case "2105":
                                case "210F":
                                    data = data - 40.0;
                                    break;
                                case "210C":
                                    data = ((x2 * 256.0) + x1) / 4.0;
                                    break;
                                case "2110":
                                    data = ((x2 * 256.0) + x1) * 0.01;
                                    break;
                                case "210E":
                                    data = (data * 127.0 / 255.0) - 64.0;
                                    break;
                                case "2104":
                                case "2111":
                                    data = data * 100.0 / 255.0;
                                    break;
                                case "210A":
                                    data = data * 3.0;
                                    break;
                                case "2114":
                                case "2115":
                                case "2116":
                                case "2117":
                                case "2118":
                                case "2119":
                                case "211A":
                                case "211B":
                                    data = data * 1.275 / 255.0;
                                    break;
                                case "2106":
                                case "2150":
                                case "2151":
                                case "2107":
                                case "2108":
                                case "2109":
                                    data = (data - 128.0) * 100.0 / 128.0;
                                    break;
                                case "211F":
                                case "2121":
                                    data = (x2 * 256.0) + x1;
                                    break;
                                case "2122":
                                    data = ((x2 * 256.0) + x1) * 0.079;
                                    break;
                                case "2123":
                                    data = ((x2 * 256.0) + x1) * 10.0;
                                    break;
                                case "2152":
                                case "2153":
                                case "2154":
                                case "2155":
                                    data = ((x2 * 256.0) + x1) * 7.995 / 65535.0;
                                    break;
                                case "2124":
                                case "2125":
                                case "2126":
                                case "2127":
                                case "2128":
                                case "2129":
                                case "212A":
                                case "212B":
                                    data = ((x2 * 256.0) + x1) * 1.999 / 65535.0;
                                    break;
                                case "2101":
                                    data = data % 128;
                                    break;
                                default:
                                    data = data; // no conversion;
                                    break;
                            }

                            result = {
                                id: id,
                                data: data
                            };
                        }
                        else {
                            logger.debug("no data for id %s when saving pids for scanner %s", id, scannerId);
                            result = null;
                        }
                    }
                    catch(err) {
                        logger.verbose("error when converting data point %s:");
                        logger.verbose(util.format("%s: %s", err.name, err.message));
                        result = null;
                    }

                    return result;
                });

                dataPoint.pids = u.filter(dataPoint.pids, function(pid) {
                    // data point cleanup - valid data point must be non empty json in the form of { "id": "data"}
                    return (u.isObject(pid) && !u.isEmpty(pid));
                })

                return resolve(dataPoint);
            })
        })

    ).then(function(convertedPidArray) {
            logger.debug("%s pid data points after conversion for scanner %s", convertedPidArray.length, scannerId);
            convertedPidArray = u.filter(convertedPidArray, function(dataPoint) {
                if (dataPoint.pids.length < 1) {
                    // dont save data or nothing in it after conversion
                    logger.debug("no data in pid with timestamp %s, ignoring", dataPoint.rtcTime);
                    return false;
                }
                else {
                    return true;
                }
            })
            logger.verbose("%s valid pid data points after conversion for scanner %s", convertedPidArray.length, scannerId);
            return convertedPidArray;
        })
}
function getCarByScannerId(scannerId) {
    logger.debug("getting car for scanner %s", scannerId);
    return models.car.findOne({
        attributes: [ "id", "vin" ],
        include: [{
            model: models.scanner,
            required: true,
            attributes: [ "id" ],
            where: {
                is_active: true,
                scanner_id: scannerId
            }
        }]
    }).then(function(result) {
        var message = undefined;
        if (u.isEmpty(result)) {
            message = util.format("no car found for scanner %s, make sure the scanner is activated", scannerId);
            logger.info(message);
            result = promise.reject(helper.makeError("INVALID_INPUT", message));
        }
        else {
            result = result.dataValues;
            logger.debug("car %s found for scanner %s", result.id, scannerId);
        }
        return result;
    })
}
function getTripByTripId(tripId) {
    return tripController.getTrip.main({ id: tripId }).then(function(result) {
        var message = undefined;
        if (u.isEmpty(result)) {
            message = util.format("trip %s not found", tripId);
            logger.info(message);
            // NOTE: wont complain if trip not found - fix in reformat()
            // result = promise.reject(helper.makeError("INVALID_INPUT", message));
        }
        return result;
    });
}

function savePids(req, res) {
    function validation() {
        var result = true;
        if (!tripId || tripId <= 0) {
            message = "tripId must be non-negative";
            result = false;
        }
        if (!(u.isArray(pidArray) && pidArray.length > 0)) {
            message = "pidArray must be a non-empty array";
            result = false;
        }
        if (!(typeof(scannerId === "string") && scannerId !== "")) {
            message = "invalid scannerId";
            result = false;
        }

        var pidArrayValidationResult = validator(pidArray, pidArraySchema, { throwError: false });
        var errors = undefined;

        if (!pidArrayValidationResult.valid) {
            errors = pidArrayValidationResult.errors;
            message = u.map(errors, function(item) {
                return item.message;
            })

            message = util.format("invalid pidArray format: %s", message.toString());
            result = false;
        }

        return result;
    }
    function reformat(car, trip, convertedPidArray) {
        function getStartMileage() {
            var startMileage = undefined;
            if (trip && !!trip.mileageStart) {
                startMileage = Number(trip.mileageStart);
                logger.debug("start mileage of trip %s: %s", trip.id, startMileage);
            }
            else {
                logger.debug("start mileage of trip %s not found, set curr mileage to 0", trip.id);
                startMileage = 0;
            }
            return startMileage;
        }
        function getCurrMileage(startMileage, currTripMileage) {
            return startMileage + currTripMileage;
        }

        var startMileage = getStartMileage();
        return u.map(convertedPidArray, function(dataPoint) {
            var currTripMileage = Number(dataPoint.tripMileage) || 0;
            var currMileage = getCurrMileage(startMileage, currTripMileage);
            return {
                data: dataPoint.pids,
                mileage: currMileage,
                mileage_trip: dataPoint.tripMileage, // raw data
                mileage_calculated: dataPoint.calculatedMileage,
                rtc_time: dataPoint.rtcTime,
                vin: car.vin,
                scanner_id: scannerId,
                trip_id: tripId,
                trip_id_raw: dataPoint.tripIdRaw
            }
        })
    }
    function doTransaction(data) {
        return sequelize.transaction(function(t) {
            var doCreate = function(data) {
                // save pids
                logger.debug("saving %s pid record", data.length);
                return models.scanner_data_pid.bulkCreate(data).then(function(result) {
                    logger.info("%s pid record saved", result.length);
                    return result;
                })
            }
            return doCreate(data);

        }).catch(function(error) {
            var message = "internal service error";
            logger.warn("error when creating pid record:", "unexpected error");
            logger.warn(error.stack);
            return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
        })
    }

    var params = req.swagger.params;
    var data = params.data.value;
    var scannerId = data.scannerId;
    var tripId = data.tripId;
    var pidArray = typeof(data.pidArray === "array") ? data.pidArray : undefined;
    var message = undefined;

    // TODO: save raw data

    if (!validation()) {
        throw (helper.makeError("INVALID_INPUT", message));
    }
    else {
        return promise.all([
            getCarByScannerId(scannerId),
            getConvertedPids(pidArray, scannerId),
            getTripByTripId(tripId)
        ])
        .spread(function(car, convertedPIDs, trip) {
            return doTransaction(reformat(car, trip, convertedPIDs));
        }).then(function(result) {
            logger.debug("pid record for %s created", scannerId);
            res.json({
                dataPointsSaved: result.length
            });
        }).catch(function(error) {
            if (!error.nonce) {
                var message = "internal service error";
                logger.warn("error when creating pid record:", "unexpected error");
                logger.warn(error.stack);
                error = helper.makeError("TRANSACTION_ERROR", "internal service error");
            }
            helper.sendErrorResponse(res, error);
        })
    }
}


module.exports = {
    savePids: savePids
}
