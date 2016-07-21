// XXX - work that needs to be done overall (pre api)
// XXXX - indiciates work that needs to be done on the api
// perhaps edmunds should be completely decoupled from this, up to future coder.
// todo; add notifications, add edmunds stuff.
var util = require('util');
var promise = require('bluebird');
var u = require('underscore');
var logger = require('../../../logger');
var models = require('../../../models');
var helper = require('../../helpers');
var edmundsController = require('./edmunds');
var config = require('./config');
var path = require('path');
var sequelize = models.sequelize;

var pushAdapter = require(path.join(
    config.globalConfig.paths.basePath, 'api', 'controllers', 'adapters', 'pushService'
))

var checkServicesByCarId = function(carId) {
    var getCarDetailByCarId = function(carId) {
        return models.car.findOne({
            attributes: [
                ["mileage_total", "mileage"],
            ],
            where: {
                id: carId
            },
            include: [
                {
                    model: models.car_shop,
                    required: false,
                    attributes: [
                        ["id_shop", "shopId"]
                    ],
                    where: {
                        id_car: carId
                    }
                }
            ]
        }).then(function(result) {
            var payload = {};
            if (!result) {
                logger.info("no car found for car #%s", carId);
                return promise.reject(helper.makeError("INVALID_INPUT", "car not found when updating services"));
            } else new Promise(function(resolve, reject) {
                result = result.dataValues
            });
            payload.carId = carId;
            // put mileage, shopId and vehicleId into payload
            if (!result.mileage) {
                logger.info("no valid mileage found for car #%s", carId);
                return promise.reject(helper.makeError("INVALID_INPUT", "total mileage not found when updating services"));
            } else {
                payload.mileage = Number(result.mileage);
            }
            if ((result.car_shop === null) || (typeof(result.car_shop.dataValues) !== "object")) {
                logger.debug("no shop found for car #%s", carId);
                payload.shopId = null;
            } else {
                payload.shopId = result.car_shop.dataValues.shopId;
            }
            return payload;
        })
    }
    var getDealershipServicesByShopId = function(shopId) {
        logger.info("shopid: %s", shopId);
        if (typeof(shopId) === "undefined") {
            return promise.resolve([]);
        } else {
            return models.service_customized.findAll({
                attributes: [
                    ["id", "serviceId"],
                    ["interval_mileage", "intervalMileage"],
                    ["interval_month", "intervalMonth"],
                    ["fixed_mileage", "fixedMileage"],
                    ["fixed_month", "fixedMonth"],
                    ["priority", "priority"]
                ],
                where: {
                    id_shop: shopId
                }
            }).then(function(services) {
                if (!services) {
                    services = [];
                }
                logger.debug("# of dealership services found: %s", services.length);
                var result = [];
                var currService = null;
                for (var i = 0; i < services.length; i++) {
                    currService = services[i];
                    currService = currService.dataValues;
                    if (
                        (!currService.intervalMileage) &&
                        (!currService.fixedMileage)
                    ) {
                        if (config.serviceUpdateOptions.checkServicesByMonth) {
                            result.push(currService);
                        }
                    } else {
                        result.push(currService);
                    }
                }
                return result;
            })
        }
    }
    var updateEdmundsServicesRelations = function(relations) {
        // allServiceRelations: array of arrays of pairs of edmunds services and approved services
        // relations: array of edmunds services' id
        // NOTE: allServiceRelations is like
        // [
        //     [<edmunds service id>, <approved service id>],
        //     ...
        // ]
        // NOTE: relations is like
        // [ <edmunds service id>, <edmunds service id>, ... ]
        var getMatchedPair = function(allServiceRelations, relations) {
            for (var i = 0; i < relations.length; i++) {
                relations[i] = u.find(allServiceRelations, function(item) {
                    return (item[0] == relations[i]);
                })
            }
            return relations;
        }
        relations = getMatchedPair(allServiceRelations, relations);
        var currRelation = undefined;
        var edmundsServiceId = undefined;
        var approvedServiceId = undefined;
        var promises = [];
        var count = 0;
        for (var i = 0; i < relations.length; i++) {
            currRelation = relations[i];
            edmundsServiceId = currRelation[0];
            approvedServiceId = currRelation[1];
            logger.debug("updating edmunds service relation for service #%s with approved service id %s", edmundsServiceId, approvedServiceId);
            promises.push(
                models.service_edmunds.update({
                    'id_service_edmunds_approved': approvedServiceId,
                }, {
                    where: {
                        id: edmundsServiceId
                    }
                }).then(function(result) {
                    if (result[0] !== 0) {
                        count++;
                    }
                })
            )
        }
        return promise.all(promises).then(function() {
            logger.info("%s / %s edmunds service relation updated", count, relations.length);
        })
    }
    var getApprovedEdmundsServicesByCarId = function(carId) {
        var getMatchedServicesPair = function(services) {
            // NOTE: side effect:
            // matched service will removed from approvedServices
            // NOTE: use approvedServices as globalVariable to mutate it
            var result = [];
            var isApproved = false;
            var currServiceItem = undefined;
            var currServiceAction = undefined
            var currApprovedService = undefined;
            var currApprovedServiceItem = undefined;
            var currApprovedServiceAction = undefined;
            for (var i = 0; i < services.length; i++) {
                currNewService = services[i]
                currServiceItem = currNewService.item.toLowerCase();
                currServiceAction = currNewService.action.toLowerCase();
                isApproved = false;
                for (var j = 0; j < approvedServices.length && !isApproved; j++) {
                    currApprovedService = approvedServices[j];
                    currApprovedServiceItem = currApprovedService.item.toLowerCase();
                    currApprovedServiceAction = currApprovedService.action.toLowerCase();
                    if (currServiceItem === currApprovedServiceItem && currServiceAction === currApprovedServiceAction) {
                        isApproved = true;
                        result.push([currNewService, currApprovedService]);
                        // remove matched approved service
                        approvedServices.splice(j, 1);
                    }
                }
            }
            return result;
        }
        var getApprovedServices = function() {
            logger.debug("getting approved edmunds services from DB");
            return models.service_edmunds_approved.findAll({
                attributes: [
                    ["id", "id"],
                    ["item", "item"],
                    ["action", "action"]
                ]
            }).then(function(result) {
                if (!result) {
                    result = {};
                } else {
                    for (var i = 0; i < result.length; i++) {
                        result[i] = result[i].dataValues;
                    }
                }
                logger.debug("# of approved services found: %s", result.length);
                return result;
            })
        }
        var getExistingEdmundServicesByCarId = edmundsController.getExistingServicesByCarId;
        var promises = [
            getExistingEdmundServicesByCarId(carId),
            getApprovedServices()
        ];
        // global variable setup
        var approvedServices = [];
        return promise.all(promises).spread(function(activeServices, approvedServicesFromDB) {
            approvedServices = approvedServicesFromDB;
            logger.debug("# of active edmunds services: " + activeServices.length);
            logger.debug("# of approved edmunds services: " + approvedServices.length);
            var result = [];
            var currService = undefined;
            result = getMatchedServicesPair(activeServices);
            logger.debug("# of active approved edmunds services: %s", result.length);
            allServiceRelations = u.map(result, function(item) {
                return [item[0].serviceId, item[1].id];
            })
            allServiceRelations = u.sortBy(allServiceRelations, function(item) {
                return item[0];
            })
            return u.map(result, function(item) {
                return item[0];
            })
        }).catch(function(error) {
            logger.info("error when getting edmunds services:");
            return [];
        })
    }
    var getExistingServiesByCarId = function(carId) {
        return models.car_service.findAll({
            attributes: [
                ["id_service_customized", "dealershipServiceId"],
                ["id_service_edmunds", "edmundsServiceId"],
                ["status", "status"],
                ["mileage", "mileage"]
            ],
            where: {
                id_car: carId,
                $or: [
                    {
                        id_service_customized: {
                            $ne: null
                        }
                    },
                    {
                        id_service_edmunds: {
                            $ne: null
                        }
                    }
                ]
            }
        }).then(function(services) {
            var dealershipServices = [];
            var edmundsServices = [];
            var result = {
                "dealershipServices": dealershipServices,
                "edmundsServices": edmundsServices
            };
            var currService = undefined;
            for (var i = 0; i < services.length; i++) {
                currService = services[i].dataValues;
                if (typeof(currService.dealershipServiceId) !== "undefined") {
                    dealershipServices.push({
                        "serviceId": currService.dealershipServiceId,
                        "status": currService.status,
                        "mileage": currService.mileage
                    });
                }
                if (typeof(currService.edmundsServiceId) !== "undefined") {
                    edmundsServices.push({
                        "serviceId": currService.edmundsServiceId,
                        "status": currService.status,
                        "mileage": currService.mileage
                    });
                }
            }
            return result;
        })
    }
    var getNewServices = function(serviceList, existingServices, currMileage) {
        // NOTE: add code here to support check service by month
        var isSameService = function(newService, existingService) {
            return (newService.serviceId === existingService.serviceId);
        }
        var getExpectedMileage = function(newServiceMileage, existingServiceMileage, currMileage, isIntervalService) {
            // NOTE: algorithm works only if offset < min(intervalMileage) / 2
            // newServiceMileage has the number of interval mileage for that service
            // e.g. service interval is 3000km, then newServiceMileage == 3000
            // type enforcements
            var mileageOffset = Number(config.serviceUpdateOptions.mileageOffset);
            newServiceMileage = Number(newServiceMileage);
            existingServiceMileage = Number(existingServiceMileage);
            currMileage = Number(currMileage);
            var expectedServiceMultiplier;
            var expectedMileage;
            // logger.debug("intervalMileage: %s, historyMileage: %s, currentMileage: %s",
            //              newServiceMileage, existingServiceMileage, currMileage);
            if (existingServiceMileage > 0) {
                // service with history mileage
                expectedServiceMultiplier = Math.round((currMileage - existingServiceMileage) / newServiceMileage);
            } else {
                // service with no history mileage
                expectedServiceMultiplier = Math.round(currMileage / newServiceMileage);
            }
            expectedServiceMultiplier = Math.max(expectedServiceMultiplier, 1); // must be at least 1
            expectedMileage = newServiceMileage * expectedServiceMultiplier + existingServiceMileage; // type enforce
            if (currMileage - expectedMileage > mileageOffset && isIntervalService) {
                // move the expectedMileage to the next interval if currMileage
                expectedMileage += newServiceMileage;
            }
            return expectedMileage;
        }
        var isValidNewService = function(expectedMileage, currMileage) {
                var mileageOffset = config.serviceUpdateOptions.mileageOffset;
                return (Math.abs(currMileage - expectedMileage) <= mileageOffset);
            }
            // gets new services to add to the car based on mileage
            // workflow is in wiki (soon)
            // make thing sorted to get O(nlog(n)) time complexity
            // NOTE: need to delete matched item in both array to reach O(n)
        currMileage = Number(currMileage); // type enforce
        serviceList = u.sortBy(serviceList, function(item) {
            return item.serviceId
        });
        existingServices = u.sortBy(existingServices, function(item) {
            return item.serviceId
        });
        var result = [];
        var serviceFound = 0;
        var expectedMileage = undefined;
        var currNewService = undefined;
        var currNewServiceMileage = undefined;
        var currExistingService = undefined;
        var currExistingServiceMileage = undefined;
        var expectedMileage = undefined;
        var isServiceFound = undefined;
        var isExistingActiveServiceFound = undefined;
        var isIntervalService = undefined;
        var doValidation = undefined;
        for (var i = 0; i < serviceList.length; i++) {
            currNewService = serviceList[i];
            // flag reset
            isServiceFound = false;
            isExistingActiveServiceFound = false;
            isIntervalService = false;
            doValidation = true;
            currExistingServiceMileage = 0;
            if (typeof(currNewService.intervalMileage) !== "undefined") { // flag reset
                // service with interval mileage
                isIntervalService = true;
                currNewServiceMileage = currNewService.intervalMileage;
            } else {
                isIntervalService = false;
                currNewServiceMileage = currNewService.fixedMileage;
            }
            for (var j = 0; j < existingServices.length && !isExistingActiveServiceFound; j++) {
                currExistingService = existingServices[j];
                if (isSameService(currNewService, currExistingService)) {
                    isServiceFound = true;
                    logger.debug("existing service #%s found", currExistingService.serviceId);
                    if (currExistingService.status !== "done") {
                        // existing service is not done yet
                        logger.debug("existing service is still active, skipping");
                        isExistingActiveServiceFound = true;
                        doValidation = false;
                    } else {
                        // mileage should be the largest number in history
                        currExistingServiceMileage = Math.max(currExistingService.mileage, currExistingServiceMileage);
                        if (isIntervalService) {
                            doValidation = true;
                        } else {
                            // dont do mileage validation if service has fixed mileage and is already done
                            logger.debug("existing service has fixed mileage, skipping");
                            doValidation = false;
                        }
                    }
                }
            }
            if (!isExistingActiveServiceFound || doValidation) {
                if (!isServiceFound) {
                    // logger.debug("validating service #%s with no record", currNewService.serviceId);
                    currExistingServiceMileage = 0; // set mileage to 0 if service not found
                } else {
                    logger.debug("validating service #%s with existing record at mileage %s",
                        currNewService.serviceId, currExistingServiceMileage);
                }
                // do validation if service is not found or doValidation is true
                expectedMileage = getExpectedMileage(
                    currNewServiceMileage,
                    currExistingServiceMileage,
                    currMileage,
                    isIntervalService
                );
                if (isValidNewService(expectedMileage, currMileage)) {
                    logger.debug("valid service found.\tcurrent mileage: %s, expectedMileage: %s, interval mileage: %s",
                        currMileage, expectedMileage, currNewServiceMileage);
                    result.push(currNewService);
                    matchedServiceRelations.push(currNewService.serviceId)
                } else {
                    logger.debug("service invalid.\tcurrent mileage: %s, expectedMileage: %s, interval mileage: %s",
                        currMileage, expectedMileage, currNewServiceMileage);
                }
            }
        }
        return result;
    }
    var getServiceIdList = function(bulkCreateResult) {
        var result = [];
        for (var i = 0; i < bulkCreateResult.length; i++) {
            if (bulkCreateResult[i].id_service_edmunds) {
                result.push(bulkCreateResult[i].id_service_edmunds);
            } else {
                result.push(bulkCreateResult[i].id_service_customized);
            }
        }
        return result;
    }
    var addNewServices = function(serviceList, serviceType) {
        // TODO: add code for populating services into DB
        // NOTE: carId is global in the scope of all procedures in this file
        var reformat = function(serviceList, serviceType) {
            var result = [];
            if (serviceType == "dealership") {
                serviceList = u.map(serviceList, function(service) {
                    service.id_service_customized = service.serviceId;
                    service.id_car = carId;
                    return service;
                })
            } else if (serviceType == "edmunds") {
                serviceList = u.map(serviceList, function(service) {
                    service.id_service_edmunds = service.serviceId;
                    service.id_car = carId;
                    return service;
                })
            }
            for (var i = 0; i < serviceList.length; i++) {
                result.push({
                    id_car: serviceList[i].id_car,
                    status: "new",
                    priority: serviceList[i].priority,
                    id_service_edmunds: serviceList[i].id_service_edmunds,
                    id_service_customized: serviceList[i].id_service_customized,
                })
            }
            logger.debug("services formatted");
            return result;
        }
        if (u.contains(config.serviceUpdateOptions.validServiceTypes), serviceType) {
            serviceList = reformat(serviceList, serviceType);
        } else {
            logger.debug("invalid service type: %s", serviceType);
            return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
        }
        logger.info("upserting %s new services", serviceList.length);
        return models.car_service.bulkCreate(serviceList, {
            returning: true
        }).then(function(result) {
            if (result) {
                result = u.map(result, function(item) {
                    return item.dataValues;
                });
            } else {
                result = []; // type enforcement
            }
            logger.verbose("# of new service record created for car %s: %s", carId, result.length);
            return result;
        })
    }

    // global variables
    var carId = carId;
    var currMileage = null; // global value for passing current mileage across the workflow
    var allServiceRelations = []; // keeps pairs of edmudns services and approved services
    var matchedServiceRelations = []; // keeps pairs of edmudns services and approved services
    var useDealershipServices = undefined;

    var checkServices = (
        (config.serviceUpdateOptions.doServiceUpdate) &&
        (
            (config.globalConfig.environment !== "test") ||
            (config.globalConfig.environment === "test" && config.doServiceUpdateInTestingEnv)
        )
    );
    if (!checkServices) {
        return promise.resolve(true);
    } else {
        return getCarDetailByCarId(carId).then(function(payload) {
            logger.debug("payload: %s", JSON.stringify(payload));
            currMileage = payload.mileage;
            var promises = [
                     getDealershipServicesByShopId(payload.shopId),
                     getApprovedEdmundsServicesByCarId(payload.carId),
                     getExistingServiesByCarId(payload.carId)
                 ]
            return promise.all(promises);
        }).spread(function(dealershipServices, edmundsServices, existingServices) {
            logger.info("# of valid dealership services found: %s", dealershipServices.length);
            logger.info("# of existing dealership services found: %s", existingServices.dealershipServices.length);
            logger.info("# of edmunds services found: %s", edmundsServices.length);
            logger.info("# of existing edmunds services found: %s", existingServices.edmundsServices.length);
            logger.info("current mileage: %s", currMileage);
            var newServices = [];
            var serviceType = "";
            var result = {};
            // console.log(dealershipServices)
            // console.log(edmundsServices)
            //
            // console.log(existingServices.dealershipServices)
            // console.log(existingServices.edmundsServices)
            // check if dealership service exists
            if (dealershipServices.length > 0) {
                useDealershipServices = true;
                serviceType = "dealership";
                logger.info("dealership service found, ignoring edmundsServices");
            } else {
                useDealershipServices = false;
                serviceType = "edmunds";
                logger.info("dealership service not found, using edmundsServices");
            }
            // NOTE: return a promise when doing optimization of checking serviecs in async order
            if (useDealershipServices) {
                newServices = getNewServices(dealershipServices, existingServices.dealershipServices, currMileage);
            } else {
                newServices = getNewServices(edmundsServices, existingServices.edmundsServices, currMileage);
            }
            result.services = newServices;
            result.serviceType = serviceType;
            return result;
        }).then(function(newServicesObject) {
            var serviceType = newServicesObject.serviceType;
            var newServices = newServicesObject.services;
            logger.info("# of new services: %s", newServices.length);
            if (!useDealershipServices) {
                // not necessary to be put in promise chain
                updateEdmundsServicesRelations(matchedServiceRelations);
            }
            return addNewServices(newServices, serviceType);
        }).catch(function(error) {
            logger.warn("error when updating services");
            logger.warn(error.stack);
        }).then(function(result) {
            function getCarDetails(carId) {
                return models.car.findOne({
                    attributes: [
                        ["car_make", "make"],
                        ["car_model", "model"],
                        ["car_year", "year"]
                    ],
                    where: {
                        id: carId
                    }
                }).then(function(result) {
                    var vehicleName = [];
                    if (!result) {
                        result = {};
                    }
                    result = result.dataValues;
                    vehicleName.push(result.year);
                    vehicleName.push(result.make);
                    vehicleName.push(result.model);
                    vehicleName = u.filter(vehicleName, function(item) {
                        return (!!item); // filter out null or undefined
                    });
                    vehicleName = vehicleName.join(' ');
                    logger.verbose("car detail for car %s: %s", carId, vehicleName);
                    return vehicleName;
                })
            }
            function getHighestPriority(services) {
                // code here
            }
            function getUserId(carId) {
                    return models.car.findOne({
                        attributes: [
                        ["id_user", "userId"]
                    ],
                        where: {
                            id: carId
                        }
                    }).then(function(result) {
                        if (result) {
                            result = result.dataValues.userId;
                            logger.verbose("userId for car %s: %s", carId, result);
                        } else {
                            result = promise.reject(helper.makeError(
                                "TRANSACTION_ERROR",
                                util.format("no user found for car %s", carId)
                            ));
                        }
                        return result;
                    })
                }
                // push notification

            return promise.all([
                promise.resolve(result),
                getCarDetails(carId),
                getUserId(carId)
            ]).spread(function(newServices, carName, userId) {
                if (newServices.length > 0) {
                    logger.verbose("sending push notification for car %s with %s new services", carId, newServices.length);
                } else {
                    logger.verbose("no new service found for car %s", carId);
                    return;
                }
                var options = {
                    name: "serviceUpdate",
                    data: {
                        "title": [ newServices.length ],
                        "content": [ carName ]
                    },
                    userId: userId
                }
                return pushAdapter.sendNotification(options);
            }).catch(function(error) {
                logger.info("error when sending push notification for service update for car %s", carId);
                logger.info(error.stack);
            })
        })
    }
}

module.exports = {
    checkServicesByCarId: checkServicesByCarId
}
