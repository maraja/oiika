const u = require('underscore');
const promise = require('bluebird');
const util = require('util');
const path = require('path');

const config = require('./config');

const logger = require(path.join(config.globalConfig.paths.basePath, 'logger'));
const models = require(path.join(config.globalConfig.paths.basePath, 'models'));
const helper = require('../../helpers');


module.exports = {
    createTrip: createTrip,
    updateTrip: updateTrip,
    getTrip: {
        main: getTripMain,
        byId: getTripById,
        byQuery: getTripByQuery
    }
}


function getCarByScannerId(scannerId) {
    logger.debug("getting car for scanner %s", scannerId);
    return models.car.findOne({
        attributes: [ "id", "vin", "mileage_total" ],
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
        if (result) {
            result = result.dataValues;
            logger.debug("car %s found for scanner %s", result.id, scannerId);
        }
        else {
            message = util.format("no car found for scanner %s, make sure the scanner is activated", scannerId);
            logger.info(message);
            result = promise.reject(helper.makeError("INVALID_INPUT", message));
        }
        return result;
    })
}
function getTripMain(whereClause, orderBy) {
    function reformat(tripObject) {
        tripObject.isActive = !u.isNumber(tripObject.rtcTimeEnd);
        tripObject.mileage = (!!tripObject.mileage) ? Number(tripObject.mileage)
                                                    : tripObject.mileage;
        tripObject.mileage_start = (!!tripObject.mileage_start) ? Number(tripObject.mileage_start)
                                                                : tripObject.mileage_start;
        return tripObject;
    }

    logger.debug("getting trip by %s", JSON.stringify(whereClause));

    return models.scanner_data_trip.findOne({
        attributes: [
            ["id", "id"],
            ["vin", "vin"],
            ["trip_id_raw", "tripIdRaw"],
            ["mileage_start", "mileageStart"],
            ["rtc_time_start", "rtcTimeStart"],
            ["rtc_time_end", "rtcTimeEnd"],
            ["mileage", "mileage"]
        ],
        where: whereClause,
        order: orderBy
    }).then(function(result) {
        if (result) {
            logger.debug("trip found");
            result = reformat(result.dataValues);
        }
        else {
            logger.debug("trip not found");
            result = {};
        } // return empty json if not found
        return result;
    })
}
function updateTripMain(params) {
    function getPayload() {
        var result = {};
        if (u.isNumber(mileage)) {
            result.mileage = mileage;
        }
        if (u.isNumber(rtcTimeEnd)) {
            result.rtc_time_end = rtcTimeEnd;
        }
        if (u.isNumber(mileageStart)) {
            result.mileage_start = mileageStart;
        }
        return result;
    }
    function doTransaction(payload) {
        // logger.debug("updating trip %s, payload: %s", tripId, JSON.stringify(payload));
        return models.scanner_data_trip.update(payload,
            {
                where: { id: tripId }
            }
        ).then(function(result) {
            result = result[0];
            if (result) {
                logger.verbose("trip %s updated", tripId);
            }
            else {
                logger.verbose("trip %s not found", tripId)
            }
        }).catch(function(err) {
            if (
                ("original" in err) &&
                ("constraint" in err.original) &&
                (err.original.constraint === "scanner_data_trip_rtc_start_end_check")
            ) {
                logger.verbose(
                    "error when updating trip %s: %s", tripId,
                    "rtcTimeEnd cannot be smaller than rtcTimeStart"
                );
                err = helper.makeError("TRANSACTION_ERROR", "rtcTimeEnd cannot be smaller than rtcTimeStart");
            }

            return promise.reject(err);
        }).catch(function(err) {
            if (!err.nonce) {
                logger.warn("error when updating trip %s: unexpected error", tripId);
                logger.warn(err.stack);
            }

            return promise.reject(err);
        })
    }

    var tripId = params.tripId;
    var mileage = params.mileage;
    var rtcTimeEnd = params.rtcTimeEnd;
    var mileageStart = params.mileageStart;

    return doTransaction(getPayload());
}
function prevTripUpdate(vin, currTrip) {
    function getPrevTrip(currTrip) {
        logger.verbose("getting previous trip of %s", vin);
        // find the trip that
        // belongs to given vin
        // was most recently created other than the current trip

        return models.scanner_data_trip.findOne({
            attributes: [
                ["id", "id"],
                ["rtc_time_start", "rtcTimeStart"],
                ["rtc_time_end", "rtcTimeEnd"],
                ["mileage", "mileage"]
            ],
            where: {
                vin: vin,
                rtc_time_start: { $lt: currTrip.rtcTimeStart }
            },
            order: [
                ["rtc_time_start", "DESC"]
            ]
        }).then(function(result) {
            if (result) {
                result = result.dataValues;
                logger.debug("previous trip found");
            }
            return result;
        })
    }
    function getDataPoint(prevTrip, type, order) {
        if (!prevTrip) {
            logger.debug("previous trip not found, skipping");
            return null;
        }

        var sortColumn, sortOrder = undefined;

        if (type === "tripMileage") {
            sortColumn = "mileage_trip";
        }
        else {
            // type === "rtcTime"
            sortColumn = "rtc_time";
        }

        if (order === "last") {
            sortOrder = "DESC";
        }
        else {
            // order === "first"
            sortOrder = "ASC"
        }

        return models.scanner_data_pid.findOne({
            attributes: [
                ["id", "id"],
                ["mileage_trip", "tripMileage"],
                ["rtc_time", "rtcTime"]
            ],
            where: {
                trip_id: prevTrip.id
            },
            order: [
                [sortColumn, sortOrder] // NOTE: temp fix, DONT USE this there is no index on mileage
            ]
        }).then(function(result) {
            if (result) {
                result = result.dataValues;
                logger.debug("%s %s data point found: %s", order, type, JSON.stringify(result));
            }
            return result;
        })
    }
    function updatePrevTrip(prevTrip, firstMileageDataPoint, lastMileageDataPoint, lastRtcTimeDataPoint) {
        var tripMileage = undefined;
        var rtcTimeEnd = undefined;
        if (!prevTrip || (mileageFound && rtcTimeEndFound)) {
            logger.debug("previous trip not found or no missing fields, skipping");
            return null;
        }

        if (!mileageFound) {
            if (!lastMileageDataPoint) {
                // no data point found
                tripMileage = 0;
            }
            else {
                tripMileage = lastMileageDataPoint.tripMileage;
            }
        }
        if (!rtcTimeEndFound) {
            if (!lastRtcTimeDataPoint) {
                rtcTimeEnd = prevTrip.rtcTimeStart;
            }
            else {
                rtcTimeEnd = lastRtcTimeDataPoint.rtcTime;
            }
        }

        logger.verbose("updating trip %s", prevTrip.id);

        var params = {
            tripId: prevTrip.id,
            mileage: tripMileage,
            rtcTimeEnd: rtcTimeEnd
        }

        return updateTripMain(params);
    }

    var prevTrip = undefined;
    var mileageFound, rtcTimeEndFound = undefined;
    var lastMileageDataPoint, lastRtcTimeDataPoint = undefined;

    return getPrevTrip(currTrip).then(function(result) {
        prevTrip = result;
        if (prevTrip) {
            mileageFound = (typeof(prevTrip.mileage) === "number");
            rtcTimeEndFound = (typeof(prevTrip.rtcTimeEnd) === "number");
            if (!mileageFound) {
                return promise.all([
                    getDataPoint(prevTrip, "tripMileage", "last"),
                    getDataPoint(prevTrip, "rtcTime", "last")
                ]).then(function(results) {
                    lastMileageDataPoint = results[0];
                    lastRtcTimeDataPoint = results[1];
                    return;
                })
            }
        }
        else {
            return;
        }

    }).then(function() {
        return updatePrevTrip(
            prevTrip,
            lastMileageDataPoint,
            lastRtcTimeDataPoint
        );
    }).then(function() {
        logger.info("previous trip of %s updated", vin);
    }).catch(function(err) {
        logger.info("error when updating previous trip of %s", vin);
        logger.info(err.stack);
    })
}

function getTripById(req, res) {
    function doValidation() {
        var result = true;
        var message = false;

        if (!u.isNumber(tripId) || tripId < 0) {
            result = false;
            message = "tripId must be non-negative";
        }

        return promise.resolve({
            result: result,
            message: message
        })
    }

    var params = req.swagger.params;
    var tripId = params.tripId.value;

    return doValidation().then(function(result) {
        if (!result.result) {
            logger.verbose("validation failed when getting trip by tripId: %s", result.message);
            throw helper.makeError("INVALID_INPUT", result.message);
        }
        else {
            var whereClause = { id: tripId };
            return getTripMain(whereClause);
        }
    }).then(function(result) {
        if (!result) {
            logger.verbose("no trip found for trip %s", tripId);
        }

        res.json(result);
    }).catch(function(err) {
        if (!err.nonce) {
            logger.warn("error when getting trip by id %s", tripId);
            logger.info(err.stack);
            err = helper.makeError("TRANSACTION_ERROR", "internal service error");
        }

        helper.sendErrorResponse(res, err);
    })
}

function getTripByQuery(req, res) {
    function doValidation() {
        var result = true;
        var message = false;

        if (!scannerId) {
            result = false;
            message = "invalid scannerId";
        }

        // TODO: valiate isLatest and isActive

        return promise.resolve({
            result: result,
            message: message
        })
    }
    function getWhereClause(params) {
        return getCarByScannerId(params.scannerId).then(function(carObject) {
            // NOTE: for now, assume latest=true and active=true
            return {
                vin: carObject.vin,
                rtc_time_end: { $eq: null }
            }
        })
    }
    function getOrderBy(params) {
        // NOTE: for now, assume latest=true and active=true
        return [ ["rtc_time_start", "DESC"] ];
    }

    var params = req.swagger.params;
    params = u.mapObject(params, function(value, key) {
        return value.value;
    })
    var scannerId = params.scannerId;
    var isLatest = params.latest;
    var isActive = params.active;
    var tripId = undefined;

    return doValidation().then(function(result) {
        if (!result.result) {
            logger.verbose("validation failed when getting trip by query string: %s", result.message);
            throw helper.makeError("INVALID_INPUT", result.message);
        }
        else {
            return promise.all([
                getWhereClause(params),
                getOrderBy(params)
            ])
        }
    }).spread(function(whereClause, orderBy) {
        return getTripMain(whereClause, orderBy);
    }).then(function(result) {
        if (!result) {
            logger.verbose("no trip found for scanner %s with given criteria", scannerId);
        }

        res.json(result);
    }).catch(function(err) {
        if (!err.nonce) {
            logger.warn("error when getting trip by id %s", tripId);
            logger.info(err.stack);
            err = helper.makeError("TRANSACTION_ERROR", "internal service error");
        }

        helper.sendErrorResponse(res, err);
    })

}

function createTrip(req, res) {
    function doValidation() {
        var result = true;
        var message = undefined;

        if (!scannerId) {
            result = false;
            message = "scannerId must be non-empty string";
        }
        else if (rtcTimeStart <= 0) {
            result = false;
            message = util.format("invalid rtc time %s", rtcTimeStart)
        }

        return promise.resolve({ // don't really have to use promise though
            result: result,
            message: message
        });
    }
    function doTransaction() {
        // create record in scanner_data_trip table
        // handles DB errors in here
        return models.scanner_data_trip.create({
            vin: vin,
            rtc_time_start: rtcTimeStart,
            mileage_start: mileageStart,
            trip_id_raw: tripIdRaw
        }).catch(function(err) {
            logger.verbose("error when creating trip for scanner %s", scannerId);
            logger.verbose("%s: %s", err.name, err.message);

            if (err.name === "SequelizeUniqueConstraintError") {
                logger.debug("trip for scanner with start time was already created", scannerId, rtcTimeStart);
                return promise.reject(
                    helper.makeError(
                        "TRANSACTION_ERROR", util.format("cannot create duplicate trip, try get the latest trip from /scan/trip/latest?vin=%s", vin)
                    )
                );
            }
            else {
                return promise.reject(
                    helper.makeError(
                        "TRANSACTION_ERROR", util.format("cannot create trip: %s", err.message)
                    )
                );
            }
        }).then(function(result) {
            if (result) {
                result = result.dataValues;
            }
            else {
                logger.info("no trip created for scanner %s", scannerId);
                result = promise.reject(helper.makeError("TRANSACTION_ERROR", "no trip record created"));
            }

            return result;
        })
    }

    var params = req.swagger.params.params.value;
    var currTrip = params;
    var scannerId = params.scannerId;
    var rtcTimeStart = params.rtcTimeStart;
    var tripIdRaw = params.tripIdRaw;
    var vin, mileageStart, tripId = undefined;

    return doValidation().then(function(result) {
        if (!result.result) {
            logger.verbose("input validation failed in createTrip,", util.format("scannerId: %s", scannerId));
            logger.verbose(result.message);
            return promise.reject(helper.makeError("INVALID_INPUT", result.message));
        }
        else {
            return getCarByScannerId(scannerId);
        }
    }).then(function(result) {
        vin = result.vin;
        mileageStart = result.mileage_total;
        return doTransaction();
    }).then(function(result) {
        tripId = result.id;
        currTrip.id = tripId;
        logger.info(
            "trip %s created for scanner %s: rtcTimeStart: %s, mileageStart: %s, tripId from scanner: %s",
            tripId, scannerId, rtcTimeStart, mileageStart, tripIdRaw);
        res.json(result);
    }).then(function() {
        // update previous trip
        // break the chain here
        logger.info("updating status of previous trip of %s", vin);
        prevTripUpdate(vin, currTrip).catch(function(err) {
            logger.info("error when updating previous trip of %s", vin);
            logger.info(err.stack);
        })
    }).catch(function(err) {
        helper.sendErrorResponse(res, err);
    })
}

function updateTrip(req, res) {
    function doValidation() {
        var result = true;
        var message = undefined;

        if (tripId <= 0) {
            result = false;
            message = util.format("invalid tripId %s", tripId);
        }
        else if ((!!mileage) && mileage <= 0) {
            result = false;
            message = util.format("invalid mileage %s", mileage);
        }
        else if ((!!rtcTimeEnd) && rtcTimeEnd <= 0) {
            result = false;
            message = util.format("invalid rtc time %s", rtcTimeEnd);
        }
        else if (!!mileageStart && mileageStart <= 0) {
            result = false;
            message = util.format("invalid start mileage %s", mileageStart);
        }
        else if (!mileage && !rtcTimeEnd && !mileageStart) {
            result = false;
            message = "nothing to update";
        }

        return promise.resolve({ // don't really have to use promise though
            result: result,
            message: message
        });
    }

    var params = req.swagger.params.params.value;
    var tripId = params.tripId;
    var mileage = params.mileage;
    var mileageStart = params.mileageStart;
    var rtcTimeEnd = params.rtcTimeEnd;

    return doValidation().then(function(result) {
        if (!result.result) {
            logger.verbose("input validation failed in updateTrip,", util.format("tripId: %s", tripId));
            logger.verbose(result.message);
            return promise.reject(helper.makeError("INVALID_INPUT", result.message));
        }
        else {
            return updateTripMain(params);
        }
    }).then(function() {
        res.json(params);
    }).catch(function(err) {
        return helper.sendErrorResponse(res, err);
    })
}
