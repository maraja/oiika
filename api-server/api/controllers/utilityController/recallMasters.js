const u = require('underscore');
const promise = require('bluebird');
const util = require('util');
const request = require('request');

var logger = require('../../../logger');
var models = require('../../../models');
var helper = require('../../helpers');
var localHelper = require('./helpers');
var config = require('./config');

var sequelize = models.sequelize;
var options = config.recallMastersOptions;

var recallMastersAPI = {
    host : options.host,
    token : options.token
}

var getVinByCarId = localHelper.getVinByCarId;

var getRecallByVin = function(vin) {
    // returns an array of json of recalls
    var doValidation = function() {
        return new promise(function(resolve, reject) {
            if (!((typeof(vin) === "string") && vin.length === 17)) {
                var err = new Error();
                err.nonce = true;
                err.name = "INVALID_INPUT";
                err.message = "vin must be 17 digit string";
                return reject(err);
            }
            else {
                return resolve();
            }
        })
    }

    var doRequest = function() {
        var url = recallMastersAPI.host + "/api/v1/lookup/" + vin + "/?format=json"
        var headers = {
            "Authorization": "Token" + " " + recallMastersAPI.token
        }

        var req = promise.promisify(request);

        return req({"url": url, "headers": headers}).then(function(result) {
            if (typeof(result.toJSON) === "function") {
                result = result.toJSON();
            }
            else {
                logger.info("error in getRecallByVin:", "RecallMasters API service error");
                logger.info(error);

                var err = new Error();
                err.nonce = true;
                // TODO: add new error type like "SERVICE_ERROR"
                err.name = "TRANSACTION_ERROR";
                err.message = "internal service error";
                return promise.reject(err);
            }

            if (result.statusCode === 200) {
                return result.body;
            }
            else {
                var message = "internal service error"; // default message

                if (result.statusCode === 400) {
                    var body = JSON.parse(result.body);
                    if (typeof(body) === "object" && typeof(body.error_description) === "string") {
                        message = body.error_description;
                    }
                }

                var err = new Error();
                logger.info("error in getRecallByVin:", "RecallMasters API result error");
                logger.info(result.body);
                err.nonce = true;
                // TODO: add new error type like "SERVICE_ERROR"
                err.name = "TRANSACTION_ERROR";
                err.message = message
                return promise.reject(err);
            }
        }, function(error) {
            if (!error.nonce) {
                logger.warn("error in getRecallByVin: ", error.name);
                logger.warn(error);
                var err = new Error();
                err.nonce = true;
                // TODO: add new error type like "SERVICE_ERROR"
                err.name = "TRANSACTION_ERROR";
                err.message = "internal service error";
                error = err;
            }

            return promise.reject(error);
        })
    }

    var doCleanup = function(rawResponse) {
        var result = {};
        try {
            result = JSON.parse(rawResponse);

            if (typeof(result) === "object" && Array.isArray(result.recalls)) {
                result = result.recalls;
            }
            else {
                logger.warn("error in getRecallByVin:", "failed to parse result, recalls is not an array")
                var err = new Error();
                err.nonce = true;
                err.name = "TRANSACTION_ERROR";
                err.message = "internal service error";
                throw err;
            }
        }
        catch(error) {
            if (!(error.name === "TRANSACTION_ERROR")) {
                logger.warn("error in getRecallByVin:", "failed to parse result, server response is not a valid json")
                var err = new Error();
                err.nonce = true;
                err.name = "TRANSACTION_ERROR";
                err.message = "internal service error";
                error = err;
            }

            return promise.reject(err);
        }


        // format result
        result = u.map(result, function(item) {
            var formattedRecall = {
                "nhtsa_id"          : item["nhtsa_id"],
                "oem_id"            : item["oem_id"],
                "type"              : item["type"],
                "parts_available"   : item["parts_available"],
                "remedy_available"  : item["is_remedy_available"],
                "name"              : item["name"],
                "description"       : item["description"],
                "risk"              : item["risk"],
                "remedy"            : item["remedy"],
                "overall_rank"      : item["overall_rank"],
                // "riskRank"          : item["risk_rank"],
                "profit_rank"       : item["profit_rank"],
                "labor_min"         : item["labor_min"],
                "labor_max"         : item["labor_max"],
                "labor_difficulty"  : item["labor_difficulty"],
                "reimbursement"     : item["reimbursement"]
            }

            if (!formattedRecall["nhtsa_id"]) {
                // remove empty string
                formattedRecall["nhtsa_id"] = undefined;
            }

            return formattedRecall;
        })

        return result;
    }

    // validation
    return doValidation().then(function() {
        return doRequest();
    }).then(function(result) {
        return doCleanup(result);
    }).then(function(result) {
        logger.debug("recalls retrieved, # of recalls: %s", result.length);
        return result;
    }).catch(function(error) {
        return promise.reject(error);
    });
}

var getActiveRecalls = function(carId) {
    // returns an array of json of avtive recalls in db

    var doValidation = function() {
        return new promise(function(resolve, reject) {
            if (!(typeof(carId) === "number" && carId >= 0)) {
                var err = new Error();
                err.nonce = true;
                err.name = "INVALID_INPUT";
                err.message = "carId must be non-negative";
                return reject(err);
            }
            else {
                return resolve();
            }
        })
    }

    var doQuery = function() {
        var issues = models.car_service;
        return issues.findAll({
            attributes: [
                ["id", "issueId"],
                ["id_recall_recallmasters", "recallId"],
                ["id_car", "carId"]
            ],
            include: [
                {
                    model: models.recall_recallmasters,
                    required: true,
                    attributes: [
                        "nhtsa_id", "oem_id", "name", "description", "remedy", "remedy_available", "parts_available"
                    ]
                }
            ],
            where: {
                id_car: carId,
                // status: { $ne: "done" }, // need all recalls
                id_recall_recallmasters: { $ne: null }
            },
            raw: true
        })
    }

    var doCleanup = function(result) {
        u.map(result, function(item) {
            item["nhtsa_id"] = item["recall_recallmasters.nhtsa_id"];
            item["oem_id"] = item["recall_recallmasters.oem_id"];
            item["name"] = item["recall_recallmasters.name"];
            item["description"] = item["recall_recallmasters.description"];
            item["remedy"] = item["recall_recallmasters.remedy"];
            item["remedy_available"] = item["recall_recallmasters.remedy_available"];
            item["parts_available"] = item["recall_recallmasters.parts_available"];

            delete item["recall_recallmasters.nhtsa_id"];
            delete item["recall_recallmasters.oem_id"];
            delete item["recall_recallmasters.name"];
            delete item["recall_recallmasters.description"];
            delete item["recall_recallmasters.remedy"];
            delete item["recall_recallmasters.remedy_available"];
            delete item["recall_recallmasters.parts_available"];
        })

        return result;
    }

    return doValidation().then(function() {
        return doQuery();
    }).then(function(result) {
        return doCleanup(result);
    }).then(function(result) {
        logger.debug("existing recalls retrieved, # of recalls: %s", result.length);
        return result;
    }).then(null, function(error) {
        return promise.reject(error);
    })
}

// getActiveRecalls(148).then(function(result) {
//     console.log(result)
//     console.log(typeof(result))
// })

// getRecallByVin("3FAHP0HA0CR164533").then(function(result) {
//     console.log(result)
//     // u.map(JSON.parse(result), function(value, key) {
//     //     if key === "recalls":
//     //     console.log("key: " + key),
//     //     console.log("value: " + value)
//     // })
// })

var getUpdatedRecalls = function(newRecalls, existingRecalls) {
    // NOTE: function has O(n^2) complexity. can be done in O(nlog(n))
    // by removing matched recalls
    // not doing so because there wont be too many recalls (< 3 for most of the time)

    // consumes 2 array objects

    var isIdenticalRecall = function(newRecall, existingRecall) {
        logger.info("checking if same recall")
        return (newRecall.nhtsa_id === existingRecall.nhtsa_id &&
                newRecall.name === existingRecall.name &&
                newRecall.description === existingRecall.description &&
                newRecall.oem_id === existingRecall.oem_id &&
                newRecall.remedy === existingRecall.remedy &&
                newRecall.remedy_available === existingRecall.remedy_available &&
                newRecall.parts_available === existingRecall.parts_available
        );
    }

    var doGet = function() {
        var result = u.map(newRecalls, function(newRecall) {
            var matchedRecall = u.find(existingRecalls, function(existingRecall) {
                return (
                    existingRecall.nhtsa_id === newRecall.nhtsa_id ||
                        (existingRecall.nhtsa_id === null || existingRecall.nhtsa_id === undefined)
                        &&
                        (existingRecall.name === newRecall.name && existingRecall.description === newRecall.description)
                );
            })

            if (matchedRecall) {
                // recall exists in db
                if (isIdenticalRecall(newRecall, matchedRecall)) {
                    // recall isn't updated
                    logger.debug("identical recall found");
                    return null;
                }
                else {
                    // recall is updated
                    logger.debug("updated recall found");
                    newRecall.issueId = matchedRecall.issueId;
                    newRecall.recallId = matchedRecall.recallId;
                    return newRecall;
                }
            }
            else {
                // recall doesn't exist in db - new recall
                return newRecall;
            }
        })

        return result
    }

    var getCleanedResult = function(uglyResult, resolve, reject) {
        // remove elements that are null or undefined
        var result = [];

        for (i = 0; i < uglyResult.length; i++) {
            if (uglyResult[i]) {
                result.push(uglyResult[i])
            }
        }

        logger.debug("updatedRecalls cleaned");

        return resolve(result);
    }

    return new promise(function(resolve, reject) {
        logger.debug("getting updatedRecalls");
        return getCleanedResult(doGet(), resolve, reject);
    });
}

var setCarId = function(recalls, carId) {
    // make sure carId is set for all recalls
    u.map(recalls, function(item) {
        if (item["carId"] === undefined) {
            item["carId"] = carId
        }
    })

    logger.debug("carId set")

    return recalls;
}

var doRecallUpdate = function(updatedRecalls, addIssueRecord) {
    var addIssueRecord = addIssueRecord; // use as global variable
    // NOTE: can't do update with one call
    // https://github.com/sequelize/sequelize/issues/4501

    // updatedRecalls: recalls in db with values to update or new recalls

    var upsert = function(updatedRecalls) {
        var doUpdate = function(id, item) {
            return models.recall_recallmasters.update(item,
                {where: { id: id }}
            ).spread(function(affectedCount, affectedRows) {
                if (affectedCount !== 0) {
                    logger.debug("recall #%s updated", id);
                    return promise.resolve();
                }
                else {
                    logger.debug("recall #%s is not updated", id);
                    return promise.reject();
                }
            })
        }
        var doInsert = function(carId, item) {
            return sequelize.transaction(function(t) {
                return models.recall_recallmasters.create(item, {transaction: t}).then(function(newRecall) {
                    var recallId = newRecall.id;
                    logger.debug("new recall #%s created", recallId);
                    logger.debug("creating new issue of recall #%s for car #%s", recallId, carId);
                    var item = {
                        "status": "new",
                        "priority": "4",
                        "id_car": carId,
                        "id_recall_recallmasters": recallId
                    };
                    if (addIssueRecord) {
                        return models.car_service.create(item, {transaction: t}).then(function(newIssue) {
                            logger.debug("new issue #%s created", newIssue.id);
                            return promise.resolve();
                        }, function(error) {
                            logger.debug("failed to create issue");
                            return promise.reject();
                        })
                    }
                    else {
                        return promise.resolve();
                    }

                })
            })
        }

        // NOTE: promise chain broken here. error uncaught if there is any
        // TODO: need to fix it
        var promises = u.map(updatedRecalls, function(item) {
            var carId = item.carId;
            var issueId = item.issueId;
            var recallId = item.recallId;

            // remove extra fields
            delete item.carId;
            delete item.issueId;
            delete item.recallId;

            if (typeof(issueId) === "number") {
                // updating existing recall
                logger.debug("updating recall #%s", recallId);
                return new promise(function(resolve, reject) {
                    return doUpdate(recallId, item).then(function() {
                        resolve();
                    }, function(error) {
                        reject(error);
                    })
                })
            }
            else {
                // adding new recall
                logger.debug("creating new recall");
                return new promise(function(resolve, reject) {
                    return doInsert(carId, item).then(function() {
                        resolve();
                    }, function(error) {
                        reject(error);
                    })
                })
            }
        })

        return promise.all(promises);
    }

    return upsert(updatedRecalls);
}

var doUpsert = function(carId, recalls, addIssueRecord) {
    if (typeof(addIssueRecord) !== "boolean") {
        addIssueRecord = true; // default value
    }
    var addIssueRecord = addIssueRecord; // make it into a global variable

    var activeRecalls = new promise(function(resolve, reject) {
        return getActiveRecalls(carId).then(function(result) {
            resolve(result);
        }, function(error) {
            reject(error);
        });
    });

    var promises = [recalls, activeRecalls];

    return promise.all(promises).spread(function(newRecalls, existingRecalls) {
        return getUpdatedRecalls(newRecalls, existingRecalls)
    }).then(function(updatedRecalls) {
        return setCarId(updatedRecalls, carId);
    }).then(function(updatedRecalls) {
        if (updatedRecalls.length > 0) {
            logger.info("updating %s recalls", updatedRecalls.length);
            return doRecallUpdate(updatedRecalls, addIssueRecord);
        }
        else {
            return 0;
        }
    }).then(function(result) {
        if ((typeof(result) !== "object") || (result.length === 0)) {
            logger.info("no recall updated");
        }
        else {
            logger.info("%s recall(s) updated", result.length);
        }
        return;
    }).catch(function(error) {
        logger.info("recall update failed");
        if (!error.nonce)  {
            logger.info(error)
        }
    })
}

var checkRecallsByCarId = function(carId, addIssueRecord) {
    var addIssueRecord = addIssueRecord;
    logger.debug("checking recalls by carId %s", carId);
    return getVinByCarId(carId).then(function(vin) {
        return checkRecallsByVin(vin, carId, addIssueRecord);
    });
}

var checkRecallsByVin = function(vin, carId, addIssueRecord) {
    // carId
    var recalls = new promise(function(resolve, reject) {
        return getRecallByVin(vin).then(function(result) {
            resolve(result);
        }, function(error) {
            reject(error);
        });
        // resolve("testRecall");
    });

    return doUpsert(carId, recalls, addIssueRecord);
}

// NOTE: shitty structure - need to refactor this function and getRecallByVin
var checkRecallsByGivenRecalls = function(carId, recalls) {
    return doUpsert(carId, recalls);
}

// checkRecallsByCarId(12);
//
// var existingRecalls = [
//   {
//     "issueId": 137,
//     "recallId": 1,
//     "nhtsa_id": null,
//     "oem_id": null,
//     "name": "recall #2",
//     "description": "recall #2's description",
//     "remedy": null,
//     "remedy_available": null,
//     "parts_available": null
//   }
// ]
//
// var newRecalls = [
//     {
//         "nhtsa_id": "12345",
//         "oem_id": null,
//         "name": "recall #2",
//         "description": "recall #2's description",
//         "remedy": null,
//         "remedy_available": null,
//         "parts_available": null
//     }
// ]
//
// getUpdatedRecalls(newRecalls, existingRecalls).then(function(result) {
//     return doRecallUpdate(result);
// })

module.exports = {
    "getActiveRecalls": getActiveRecalls,
    "getVinByCarId": getVinByCarId,
    "doUpsert": doUpsert,
    "checkRecallsByVin": checkRecallsByVin,
    "checkRecallsByCarId": checkRecallsByCarId,
    "checkRecallsByGivenRecalls": checkRecallsByGivenRecalls,
    "getRecallByVin": getRecallByVin
}

// checkRecallsByCarId(53);
// getRecallByVin("1C6RR7KT7ES124900");
