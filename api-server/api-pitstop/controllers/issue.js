var promise = require("bluebird");
var u = require('underscore');
var util = require('util');
var http = require('https');

var isJSON = require('is-json');

var logger = require('../../logger');
var helper = require('../helpers');
var models = require('../../models');

var config = require('./config');

var sequelize = models.sequelize;

var scanController = require('./scan');

module.exports = {
    createIssue: createIssue,
    updateIssue: updateIssue
};

function createIssue(req, res) {
    var doValidation = function(issue) {
        var validationResult = true;
        var message = undefined;

        var hasValidType = function(issue) {
            if (!u.contains(config.createIssueOptions.validTypes, issue.issueType)) {
                message = util.format("unsupported issue type: %s", issue.issueType);
                return false;
            }
            else {
                return true;
            }
        }
        var hasValidFields = function(issue) {
            var isValidDtcCode = function(dtcCode) {
                var regex = config.createIssueOptions.dtcCodeRegex;
                return regex.test(dtcCode);
            };

            var result = true;

            if (issue.issueType === "dtc") {
                if (typeof(issue.data) !== "object") {
                    message = "data must be an object";
                    result = false;
                }
                else if ((typeof(issue.carId) === "number") && (typeof(issue.scannerId) === "string")) {
                    message = "got both carId and scannerId, must provide only one of them";
                    result = false
                }
                else if ((typeof(issue.carId) !== 'number') && (typeof(issue.scannerId) !== "string")) {
                    message = "missing both carId and scannerId";
                    result = false;
                }
                else if (!(typeof(issue.data.dtcCode) === "string" && issue.data.dtcCode !== "")) {
                    message = "dtcCode must be a non-empty string";
                    result = false;
                }
                else if (!isValidDtcCode(issue.data.dtcCode)) {
                    message = "invalid DTC code";
                    result = false;
                }
                else if (!(
                    (typeof(issue.data.freezeData) === "undefined")
                    ||
                    ((isJSON(issue.data.freezeData, true)) && (Object.keys(issue.data.freezeData).length > 0))
                )) {
                    message = "freezeData must be undefined or a non-empty json";
                    result = false;
                }
                else if (!(typeof(issue.data.isPending) === "boolean")) {
                    message = "isPending must be a boolean";
                    result = false;
                }
            }

            return result;
        }

        var type = issue.issueType;
        validationResult = hasValidType(issue) && hasValidFields(issue);

        if (!validationResult) {
            logger.debug("error in createIssue:", "validation failed:", message);
        }

        return { result: validationResult, message: message };
        
    }
    var saveIssue = function(issue) {
        var saveDTCIssue = function(issue) {
            var saveFreezeData = function(issue) {
                var shouldSaveFreezeData = function(isPending) {
                    // for now, dont save freeze data if issue is pending dtc;
                    return !isPending;
                }
                var getScannerId = function(issue) {
                    var findScannerIdBycarId = function(carId) {
                        return models.scanner.findOne({
                            attributes: [
                                ["scanner_id", "scannerId"]
                            ],
                            where: sequelize.and(
                                { id_car: carId },
                                { is_active: true }
                            )
                        }).then(function(result) {
                            if (!result) {
                                result = promise.reject(
                                    helper.makeError(
                                        "TRANSACTION_ERROR",
                                        util.format("no active scannerId found for car %s", carId))
                                    );
                            }
                            else {
                                result = result.dataValues.scannerId;
                            }

                            return result;
                        })
                    }

                    if (typeof(issue.scannerId) === "string") {
                        logger.debug("scannerId found in request, returning");
                        return promise.resolve(issue.scannerId);
                    }
                    else {
                        logger.debug("scannerId not in request, getting from DB");
                        return findScannerIdBycarId(issue.carId);
                    }
                }

                var doSave = scanController.saveFreezeData;

                // NOTE: can do some optimization here if compiler doesn't

                if (!shouldSaveFreezeData(issue.data.isPending)) {
                    logger.debug("not saving freeze data since dtc issue is pending");
                    return promise.resolve();
                }
                else {
                    logger.debug("saving freeze data");
                }
                return getScannerId(issue).then(function(scannerId) {
                    var attributes = {
                        scanner_id: scannerId,
                        freeze_data: issue.data.freezeData,
                        mileage: issue.data.mileage,
                        rtc_time: issue.data.tcTime,
                        dtc_code: issue.data.dtcCode
                    };

                    return doSave(attributes).then(function(result) {
                        if (result.isSaved) {
                            logger.info("freeze data with DTC code %s from scanner %s saved", attributes.dtc_code, attributes.scanner_id);
                        }
                        else {
                            logger.info("freeze data was not saved: %s", result.message);
                        }
                    })
                })
            }
            var getCarId = function(issue) {
                var findCarIdByScannerId = function(scannerId) {
                    return models.scanner.findOne({
                        attributes: [
                            ["id_car", "carId"]
                        ],
                        where: sequelize.and(
                            { "is_active": true },
                            { "scanner_id": scannerId }
                        )
                    }).then(function(result) {
                        if (!result) {
                            return promise.reject(
                                helper.makeError("TRANSACTION_ERROR",
                                                 util.format("car is not found for scanner %s", scannerId)
                                )
                            )
                        }
                        else {
                            result = result.dataValues.carId;
                            // like { carId: 123 }
                            logger.debug("carId found: %s", result);
                            return result;
                        }
                    })
                }

                logger.debug("getting carId");

                if (typeof(issue.carId) === "number") {
                    logger.debug("carId is given, returning carId: %s", issue.carId);
                    return issue.carId;
                }
                else {
                    // scannerId must exist if request passes validation
                    logger.debug("carId not found, getting carId by scannerId");
                    return findCarIdByScannerId(issue.scannerId);
                }
            }
            var findIdByDtcCode = function(dtcCode) {
                logger.debug("getting DTC id by dtcCode %s", dtcCode);
                return models.dtc.findOne({
                    attributes: [
                        ["id", "dtcId"]
                    ],
                    where: {
                        "dtc_code": dtcCode
                    }
                }).then(function(result) {
                    if (!result) {
                        logger.info("id not found for dtc code %s", dtcCode);
                        return promise.reject(
                            helper.makeError("TRANSACTION_ERROR", util.format("unsupported DTC Code: %s", dtcCode))
                        );
                    }
                    else {
                        result = result.dataValues.dtcId
                        // like { dtcId: 123 }
                        logger.debug("dtcId found: %s", result);
                        return result;
                    }
                })
            }
            var doUpsert = function(attributes, whereClause) {
                // NOTE: mimics the behaviour of sequelize's upsert:
                // returns true if event was insert, otherwise returns false;

                var doInsert = function(attributes, whereClause) {
                    return models.car_service.create(attributes).then(function() {
                        return true;
                    })
                }
                var doUpdate = function(attributes, whereClause) {
                    return models.car_service.update(attributes, { where: whereClause })
                    .then(function(result) {
                        // return true if some rows updated
                        if (result[0] >= 1) {
                            logger.warn("more than 1 row updated when upserting issue");
                        }
                        return (result[0] !== 0);
                    })
                }

                return doUpdate(attributes, whereClause).then(function(result) {
                    if (!result) {
                        // no rows affected, do isnert instead
                        return doInsert(attributes, whereClause);
                    }
                    else {
                        // update done, return false
                        return false;
                    }
                }).catch(function(error) {
                    if (!error.nonce) {
                        logger.warn("error when creating issue: %s, %s", error.name, error.message);
                        error = helper.makeError("TRANSACTION_ERROR", "internal service error");
                    }
                    return promise.reject(error);
                })
            }

            var promises = [
                getCarId(issue),
                findIdByDtcCode(issue.data.dtcCode)
            ]

            // saveFreezeData is not in the chain
            saveFreezeData(issue).catch(function(error) {
                logger.info(
                    "error when saving freeze data with DTC code %s from scanner %s or car %s:",
                    issue.data.dtcCode, issue.scannerId, issue.carId
                );

                if (!error.nonce) {
                    logger.info(error.stack);
                }
                else {
                    logger.info(error.message);
                }
            })

            return promise.all(promises).spread(function(carId, dtcId) {
                carIdGlobal = carId; // update variable in outer scope for debuggin message
                var attributes = {
                    "id_car": carId,
                    "id_dtc": dtcId,
                    priority: config.createIssueOptions.DTCPriority,
                    "status": "new",
                    "dtc_is_pending": issue.data.isPending
                };

                var whereClause = sequelize.and(
                    { id_car: carId },
                    { id_dtc: dtcId },
                    { status: "new" } // only do upsert on new DTC issues
                );

                return doUpsert(attributes, whereClause);

            }).then(function(result) {
                if (result) {
                    // true - create event
                    logger.info("DTC code %s for car %s created", issue.data.dtcCode, carIdGlobal);
                }
                else {
                    // false - update event
                    logger.info("DTC code %s for car %s updated", issue.data.dtcCode, carIdGlobal);
                }
                return true;

            }).catch(function(error) {
                if (!error.nonce) {
                    logger.warn("error in save issue: unexpected error");
                    logger.warn(error.stack);
                    error = helper.makeError("TRANSACTION_ERROR", "internal service error");
                }

                return promise.reject(error);
            })
        }

        var type = issue.issueType;

        logger.info("saving new %s issue:", type);

        if (type === "dtc") {
            return saveDTCIssue(issue).then(function() {
                return true;
            })
        }
        else {
            logger.info("unsupported issue type: %s", type);
            return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
        }
    }

    var params = req.swagger.params;
    var issue = params.issue.value;
    var validationResult = doValidation(issue);
    var carIdGlobal = undefined;

    if (!validationResult.result) {
        throw helper.makeError("INVALID_INPUT", validationResult.message);
    }
    else {
        var promises = [


        ];

        return saveIssue(issue).then(function(issueSaveResult) {
            res.json({
                "message": util.format("DTC code %s for car %s saved", issue.data.dtcCode, carIdGlobal)
            });
        }).catch(function(error) {
            if (!error.nonce) {
                logger.warn("error in create car:", "unexpected error:");
                logger.warn(error.stack);
                error = helper.makeError("TRANSACTION_ERROR", "internal service error");
            }

            helper.sendErrorResponse(res, error);
        })
    }
}

function updateIssue(req,res) {
    var params = req.swagger.params;
    var issue = params.issue.value;
    var issueId = issue.issueId;
    var status = issue.status;
    var daysAgo = issue.daysAgo;
    var date_done = new Date();
    var mileage = issue.mileage;
    var date_today = new Date();
    var fields = ['daysAgo', 'mileage'];
    var validstates = ['new', 'pending', 'accepted', 'done'];
    var message = "unsupported status";

    function doTransaction(issue) {
        return sequelize.transaction(function(t) {
            return models.car_service.update(
                {
                    status: status,
                    done_at: date_done,
                    mileage: mileage
                },
                {where: { id: issueId }},
                {transaction: t}
            ).then(function(updatedIssue) {
                return updatedIssue;
            }, function(error) {
                message = "internal db error";
                logger.info("error when updating issue: ", message);
                promise.reject(helper.makeError("TRANSACTION_ERROR", message));
            });
        }, function(error) {
            message = "internal db error";
            logger.info("error when updating issue: ", "unexpected error");
            helper.sendErrorResponse(res, helper.makeError("TRANSACTION_ERROR", message));
        });
    }

    function isValid() {
        if (validstates.indexOf(status) < 0) {
            message = "Please enter a valid service status: done, new, accepted, pending.";
            return false;
        }

        if (status === "done") {
            if (daysAgo === undefined || mileage === undefined) {
                message = "issue is done but daysAgo or mileage isn't provided";
                return false;
            }
            if (daysAgo < 0 || mileage < 0) {
                message = "daysAgo or mileage is negative";
                return false;
            }
            date_done.setDate(date_done.getDate() - daysAgo);
        } else {
            if (daysAgo !== undefined || mileage !== undefined) {
                message = "issue is not done but daysAgo or mileage is provided";
                return false;
            }
        }

        return true;
    }


    if (!isValid()) {
        throw(helper.makeError("INVALID_INPUT", message));

    } else {
        doTransaction(issue).then(function(result) {
            // not using "===": result would either be "[ 0 ]" or "[ 1 ]" as in console.log,
            // type is "object" but there is no details about that is being returned
            // ref: https://github.com/sequelize/sequelize/pull/1293
            if (result == 0) {
                message = "issue is not updated: no records affected in db";
                logger.info("error when updating issue: ", message);
                return promise.reject(helper.makeError("TRANSACTION_ERROR", "no matching issue found"));
            } else {
                result = {};
                result.issueId = issueId;
                result.status = status;

                if (status === "done")
                    result.doneAt = date_done;
                    result.mileage = mileage;

                return result;
            }
        }, function(error) {
            if (!error.nonce) {
                message = "internal db error";
                logger.info("error when updating issue: ", "unexpected error in transaction");
                promise.reject(helper.makeError("TRANSACTION_ERROR", message));
            }
        }).then(function(result) {
            res.json(result);
        }, function(error) {
            helper.sendErrorResponse(res, error);
        });
    }
}
