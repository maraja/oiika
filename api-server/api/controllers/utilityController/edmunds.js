const u = require('underscore');
const promise = require('bluebird');
const util = require('util');
const request = require('request-promise');

var logger = require('../../../logger');
var models = require('../../../models');
var helper = require('../../helpers');
var localHelper = require('./helpers');
var config = require('./config');

// TODO: testing required stub server

var sequelize = models.sequelize;
var options = config.edmundsOptions;

var edmundsAPI = {
    host : options.host,
    key : options.key,
    getUrl: {
        vehicleId: function(make, model, year) {
            make = String(make);
            model = String(model);
            year = String(year);
            logger.debug("generating url for car: %s %s %s", year, make, model)
            var url = edmundsAPI.host + "/api/vehicle/v2"
                    + "/" + make
                    + "/" + model
                    + "/" + year
                    + "?" + "fmt=json"
                    + "&" + "api_key=" + edmundsAPI.key
            return url;
        },
        maintenance: function(vehicleId) {
            var url = edmundsAPI.host + "/v1/api/maintenance/actionrepository/findbymodelyearid"
                    + "?"
                    + "modelyearid=" + vehicleId
                    + "&" + "fmt=json"
                    + "&" + "api_key=" + edmundsAPI.key
            return url;
        }

    }
}

// var getEmundsIdByCarId = function(carId) {
//     return getServices()
// }

var getVinByCarId = localHelper.getVinByCarId;
var getCarByCarId = localHelper.getCarByCarId;

var getVehicleId = function(carId) {
    var getVehicleIdFromDB = function(carId) {
        return models.car_edmunds.findOne({
            attributes: [
                ["vehicle_id", "vehicleId"],
            ],
            where: {
                id_car: carId
            }
        }).then(function(result) {
            if (!result) {
                result = null;
            }
            else {
                result = result.dataValues.vehicleId;
            }
            return result;
        })
    }

    var saveVehicleId = function(carId, vehicleId) {
        logger.debug("saving vehicleId for %s", carId);
        return models.car_edmunds.create({
            id_car: carId,
            vehicle_id: vehicleId
        }).then(function(result) {
            logger.debug("vehicle id for %s saved", carId);
            return;
        }).catch(function(error) {
            if (error.name === "SequelizeUniqueConstraintError" ) {
                logger.debug("vehicleId already exists");
            }
            else {
                return promise.reject(error);
            }
        })
    }

    var getMetadata = function(carId) {
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
            if (!result) {
                result = {};
            }
            else {
                result = result.dataValues;
            }

            return result;
        })
    }

    var getVehicleIdFromEdmunds = function(metadata) {
        // metadata is like { "make": "car's make", "model": "car's model", "year": 1234 }
        var url = edmundsAPI.getUrl.vehicleId(metadata.make, metadata.model, metadata.year);
        logger.debug("getting vehicleId from edmunds for car #%s", carId);
        return request(url).then(function(result) {
            try {
                result = JSON.parse(result).id;
            }
            catch(error) {
                logger.info("error when processing result from edmuds, %s - %s", error.name, error.message);
                result = helper.makeError("TRANSACTION_ERROR", "error when processing result from edmuds");
            }
            return result;
        });
    }

    return getVehicleIdFromDB(carId).then(function(result) {
        if (!result) {
            logger.debug("vehicleId not found in db, retrieving from edmunds");
            return getMetadata(carId).then(function(metadata) {
                logger.debug("vehicle metadata found");

                return getVehicleIdFromEdmunds(metadata).then(function(vehicleId) {
                    logger.debug("vehicleId found from edmunds: %s", vehicleId);

                    saveVehicleId(carId, vehicleId).catch(function(error) {
                        logger.info("error when saving vehicleId for %s:", carId);
                        logger.info(error.stack)
                    })

                    return vehicleId;
                })
            })
        }
        else {
            logger.debug("vehicleId found from DB: %s", result);
            return result;
        }
    })
}

var getExistingServicesByCarId = function(carId) {
    var getServicesFromDB = function(vehicleId) {
        return models.service_edmunds.findAll({
            attributes: [
                ["id", "serviceId"],
                ["edmunds_id", "edmundsId"],
                ["vehicle_id", "vehicleId"],
                ["priority", "priority"],
                ["engine_code", "engineCode"],
                ["item", "item"],
                ["action", "action"],
                ["description", "description"],
                ["interval_mileage", "intervalMileage"],
                ["fixed_mileage", "fixedMileage"],
                ["interval_month", "intervalMonth"],
                ["fixed_month", "fixedMonth"]
            ],
            where: {
                vehicle_id: vehicleId
            }
        }).then(function(result) {
            if (!result) { result = {}; }
            else {
                for (var i = 0; i < result.length; i++) {
                    result[i] = result[i].dataValues;
                }
            }
            logger.debug("# of edmunds services found in DB: %s", result.length);
            return result;
        })
    }
    return getVehicleId(carId).then(function(vehicleId) {
        return getServicesFromDB(vehicleId);
    })
}

var updateEdmundsServices = function(carId) {
    var getApprovedActiveServicesByCarId = function(carId) {
        var getActiveServicesByCarId = function(carId) {
            var getServices = function(vehicleId) {
                var isValidService = function(service) {
                    // only interval services or one time services are allowed
                    return (service.frequency === 3 || service.frequency === 4);
                }
                var url = edmundsAPI.getUrl.maintenance(vehicleId);
                var options = {
                    url: url
                }

                return request(options).then(function(result) {
                    try {
                        result = JSON.parse(result).actionHolder;
                    }
                    catch(error) {
                        logger.info("error when getting edmunds services from web: %s - %s", error.name, error.message);
                        return promise.reject(helper.makeError("TRANSACTION_ERROR", "error when parsing result from edmunds for services"));
                    }

                    return result;
                }).then(function(result) {
                    logger.debug("# of all edmunds services found from web: %s", result.length);
                    for (var i = result.length - 1; i >= 0; i--) {
                        // remove edmunds services that has frequency other than 3 or 4
                        if (!isValidService(result[i])) {
                            result.splice(i, 1);
                        }
                    }
                    logger.debug("# of valid edmunds services found from web: %s", result.length);
                    return result;
                })
            }
            var reformat = function(service) {
                var vehicleId = vehicleIdGlobal;
                var result = {};

                // docs on service format
                // http://developer.edmunds.com/api-documentation/vehicle/service_maintenance/v1/

                result.vehicle_id = vehicleId;
                result.edmunds_id = service.id;
                result.priority = service.priority || 0;
                result.engine_code = service.engineCode || null;
                result.item = service.item || null;
                result.description = service.itemDescription || null;
                result.action = service.action || null;

                if (service.frequency === 3) {
                    // frequency === 3: service with fixed mileage
                    result.fixed_mileage = service.intervalMileage || null;
                    result.fixed_month = service.intervalMonth || null;
                }
                else if (service.frequency === 4) {
                    // frequency === 3: service with interval mileage
                    result.interval_mileage = service.intervalMileage || null;
                    result.interval_month = service.intervalMonth || null;
                }

                return result;

            }

            var vehicleIdGlobal = undefined;

            logger.debug("getting edmunds serivices from web for car #%s", carId);
            return getVehicleId(carId).then(function(vehicleId) {
                vehicleIdGlobal = vehicleId;
                return getServices(vehicleId);
            }).then(function(services) {
                var result = [];

                logger.debug("reformatting results from edmunds");

                u.each(services, function(service) {
                    try {
                        result.push(reformat(service));
                    }
                    catch(err) {
                        logger.info("cannot reformat service from edmunds: %s - %s", err.name, err.message);
                    }
                })

                logger.debug("# of edmunds services reformatted: %s", result.length);
                return result;
            })
        }
        return getActiveServicesByCarId(carId);
    }
    var upsertEdmundsServices = function(newServices, existingServices) {
        logger.info("adding / updating edmunds services for car #%s", carId);
        logger.debug("# of new services: %s", newServices.length);
        logger.debug("# of existing services: %s", existingServices.length);

        var isSameService = function(newService, existingService) {
            // console.log(newService.edmunds_id + " " + existingService.edmunds_id)
            return (newService.edmunds_id === existingService.edmunds_id);
        }
        var isIdenticalService = function(newService, existingService) {
            // console.log(newService)
            // console.log(existingService)
            // console.log(newService.interval_mileage)
            // console.log(existingService.interval_mileage)
            // console.log(newService.item == existingService.item)
            // console.log(newService.action == existingService.action)
            // console.log(newService.description == existingService.description)
            // console.log(newService.fixed_mileage == existingService.fixed_mileage)
            // console.log(newService.interval_mileage == existingService.interval_mileage)
            // console.log(newService.fixed_month == existingService.fixed_month)
            // console.log(newService.fixed_mileage == existingService.fixed_mileage)
            // user "==" to allow (null == undefined)
            return (newService.item == existingService.item &&
                    newService.action == existingService.action &&
                    newService.description == existingService.description &&
                    newService.fixed_mileage == existingService.fixedMileage &&
                    newService.interval_mileage == existingService.intervalMileage &&
                    newService.fixed_month == existingService.fixedMonth &&
                    newService.fixed_mileage == existingService.fixedMileage)
        }
        var getUpdatedServices = function(newServices, existingServices) {
            var result = [];
            var currNewService = undefined;
            var currExistingService = undefined;
            var matchedServiceFound = false;

            // NOTE: this part of code filters out edmunds services that are new or that are in db but has updated info.
            // could be shitty in terms of performance (O(n^2) complexity)
            // NOTE: could be optimized by removing matched service in new services and existing services.
            // NOTE: could be optimized by running async lookups (one worker for each new service)
            // same as in code for recallMastersAPI
            // cloud be optimized with classes to avoid extra function definitions

            for (var i = 0; i < newServices.length; i++) {
                currNewService = newServices[i];

                // logger.debug("current service: %s", currNewService.edmunds_id);
                matchedServiceFound = false; // reset the flag
                for (var j = 0; j < existingServices.length && !matchedServiceFound; j++) {
                    currExistingService = existingServices[j];

                    if (isSameService(currNewService, currExistingService)) {
                        matchedServiceFound = true;

                        if (!isIdenticalService(currNewService, currExistingService)) {
                            logger.debug("updated service found: %s", currNewService.edmunds_id);
                            // updated service record
                            currNewService.id = currExistingService.id;
                            result.push(currNewService);
                        }
                    }
                }
                if (!matchedServiceFound) {
                    logger.debug("new service found: %s", currNewService.edmunds_id);

                    result.push(currNewService);
                }
            }

            logger.info("# of edmunds services to update: %s", result.length);
            return result;
        }
        var doUpsert = function(services) {
            // NOTE: can be optimized by using bulk create
            var doUpdate = function(service) {
                logger.debug("updating edmunds service %s", service.edmunds_id);
                return models.service_edmunds.update(service,
                    {where: { id: service.id }}
                ).spread(function(affectedCount, affectedRows) {
                    if (affectedCount !== 0) {
                        logger.debug("edmunds service #%s updated", id);
                        return promise.resolve();
                    }
                    else {
                        logger.info("edmunds service #%s is not updated", id);
                        return promise.reject();
                    }
                })
            }
            var doInsert = function(service) {
                logger.debug("inserting edmunds service %s", service.edmunds_id);
                return models.service_edmunds.create(service).then(function(result) {
                    logger.debug("edmunds service %s created", result.id);
                    return;
                })
            }

            var promises = [];

            for (var i = 0; i < services.length; i++) {
                var currService = services[i];
                if (typeof(currService.id) === "number") {
                    promises.push(doUpdate(currService));
                }
                else {
                    promises.push(doInsert(currService));
                }
            }

            return promise.all(promises);
        }

        // TODO: make it into a promise when using async matching
        var updatedServices = getUpdatedServices(newServices, existingServices);
        return doUpsert(updatedServices);
    }


    var promises = [
        getApprovedActiveServicesByCarId(carId),
        getExistingServicesByCarId(carId)
    ];

    return promise.all(promises).spread(function(newServices, existingServices) {
        logger.debug("# of new services: %s", newServices.length);
        logger.debug("# of existing services: %s", existingServices.length);

        return upsertEdmundsServices(newServices, existingServices).then(function() {
            logger.info("edmund services updated");
        }).catch(function(error) {
            logger.info("error when checking edmunds: %s - %s", error.name, error.message);
            logger.info(error.stack)
        })
    })
}

module.exports = {
    getVehicleId: getVehicleId,
    updateEdmundsServices: updateEdmundsServices,
    getExistingServicesByCarId: getExistingServicesByCarId
}

// getServices(19);
// updateEdmundsServices(155);
