var u = require('underscore');
var util = require('util');
var promise = require('bluebird')

var controllers = require('./controllers');

var logger = controllers.logger;
var helper = controllers.helper;
var ParseModels = controllers.models;
var SequelizeModels = controllers.sequelizeModels;
var sequelize = SequelizeModels.sequelize;

var stub = require('./stub').json;

module.exports = {
    saveCars: saveCars,
    updateServices: updateServices,
    saveServiceHistory: saveServiceHistory,
    saveActiveServices: saveActiveServices
};

function saveCars(data) {
    function reformat(userId, carObject) {
        var result = carObject.basicInfo;
        result.id_user = userId;
        return result;
    }

    var userId = data.user.newId;
    var carObjects = data.cars;

    logger.debug("creating %s cars for user %s", carObjects.length, userId);
    var payloads = u.map(carObjects, function(item) {
        return reformat(userId, item);
    })

    logger.debug("migrating basic info of cars for user %s", userId);
    if (payloads.length > 0) {
        return SequelizeModels.car.bulkCreate(payloads).then(function() {
            logger.debug("cars created for user %s", userId);
            // get cars from DB to retrieve ids
            return SequelizeModels.car.findAll({ where: { id_user: userId }});
        }).then(function(newCars) {
            newCars = u.map(newCars, function(item) { return item.dataValues; });
            data.cars = u.map(data.cars, function(item) {
                item.basicInfo = u.findWhere(newCars, { vin: item.basicInfo.vin });
                return item;
            })
            return;
        })
    }
    else {
        logger.debug("no car to be created, skipping");
        return promise.resolve();
    }
}

function updateServices(data) {
    function getPromises(carIds, currAt, result) {
        if (currAt >= carIds.length) {
            return result;
        }
        else {
            logger.info("updating service for car %s/%s of user %s", currAt+1, carIds.length, userId);
            return promise.all([
                // NOTE: not checking recalls
                // controllers.utilityController.checkRecallsByCarId(carIds[currAt])
                // .catch(function(err) {
                //     logger.info("error when updating recalls");
                //     logger.info(err.message);
                // }),
                controllers.utilityController.checkEdmundsServicesByCarId(carIds[currAt])
                .catch(function(err) {
                    logger.info("error when updating edmunds service");
                    logger.info(err.message);
                })
            ]).delay(1000).then(function(currResult) {
                result.push(currResult);
                return getPromises(carIds, currAt + 1, result);
            })
        }
    }
    var userId = data.user.newId;
    var carIds = u.map(data.cars, function(item) {
        return item.basicInfo.id;
    })

    var promises = getPromises(carIds, 0, []); // NOTE: need to delay the process since edmunds has limitation of query per second

    return promise.all(promises).then(function() {
        logger.info("services of %s cars for user %s updated", carIds.length, userId);
        return;
    })
}

function saveServiceHistory(data) {
    // NOTE: things in here are just done in super shitty manner. it queries for each service to check
    // if that exists in DB.
    function saveForEach(car) {
        function getSingleService(modelName, whereClause) {
            return SequelizeModels[modelName].findOne({ where: whereClause })
            .then(function(result) { return (!!result) ? result.dataValues : null });
        }
        function getServiceByType(type, services, carId) {
            function getExistingServices(key, value) {
                var existingServices = undefined;
                if (key === "serviceInterval") {
                    existingServices =  promise.all(u.map(value, function(item) {
                        if (!item.dealership) {
                            return null;
                        }
                        else {
                            return getSingleService("service_customized", {
                                item: item.item,
                                action: item.action,
                                interval_mileage: item.intervalMileage,
                                id_shop: item.dealership.newId
                            })
                        }

                    }))
                }
                else if (key === "serviceFixed") {
                    existingServices =  promise.all(u.map(value, function(item) {
                        if (!item.dealership) {
                            return null;
                        }
                        else {
                            return getSingleService("service_customized", {
                                item: item.item,
                                action: item.action,
                                fixed_mileage: item.intervalMileage,
                                id_shop: item.dealership.newId
                            })
                        }
                    }))
                }
                else if (key === "edmundsService") {
                    existingServices =  promise.all(u.map(value, function(item) {
                        return getSingleService("service_edmunds", {
                            edmunds_id: item.edmundsId
                        })
                    }))
                }
                else if (key === "recall") {
                    existingServices =  promise.all(u.map(value, function(item) {
                        return getSingleService("recall_recallmasters", {
                            nhtsa_id: item.nhtsaID,
                            oem_id: item.oemID,
                            name: item.name
                        })
                    }))
                }
                else if (key === "dtc") {
                    existingServices = promise.all(u.map(value, function(item) {
                        return getSingleService("dtc", {
                            dtc_code: item.dtcCode
                        })
                    }))
                }

                return existingServices.then(function(result) {
                    return u.filter(result, function(item) {
                        return (!u.isEmpty(item));
                    })
                })
            }
            function getReformattedService(existingServices, newServices, type) {
                function getTableName(type) {
                    var result = undefined;
                    switch (type) {
                        case "serviceInterval":
                        case "serviceFixed":
                            result = "service_customized";
                            break;
                        case "edmundsService":
                            result = "service_edmunds";
                            break;
                        case "recall":
                            result = "recall_recallmasters";
                        case "dtc":
                            result = "dtc";
                    }
                    return result;
                }
                function getDefaultPriority(type) {
                    switch (type) {
                        case "serviceFixed":
                        case "serviceInterval":
                        case "edmundsService":
                            result = 1;
                            break;
                        case "recall":
                        case "dtc":
                            result = 4;
                            break;
                    }
                    return result;
                }
                function reformat(newService, existingServices, type) {
                    var matchedService = undefined;
                    var serviceMatched = undefined;
                    var content = undefined;

                    var type = type;

                    if (type === "serviceInterval" || type === "serviceFixed") {
                        try {
                            matchedService = u.findWhere(existingServices, {
                                action: newService.action,
                                item: newService.item,
                                id_shop: newService.dealership.newId
                            })
                        }
                        catch(err) {
                            if (err.name === "TypeError") {
                                // dealership is null
                                matchedService = null;
                            }
                            else {
                                logger.warn("unexpected error when reformatting dealership services when saving service history");
                            }
                        }
                    }
                    else if (type === "edmundsService") {
                        matchedService = u.findWhere(existingServices, {
                            edmunds_id: newService.edmundsId
                        })

                    }
                    else if (type === "recall") {
                        matchedService = u.findWhere(existingServices, {
                            nhtsa_id: newService.nhtsaID,
                            oem_id: newService.oemID
                        })
                    }
                    else if (type === "dtc") {
                        matchedService = u.findWhere(existingServices, {
                            dtc_code: newService.dtcCode,
                        })
                    }

                    var priority = newService.metadata.priority;
                    if (typeof(priority) !== "number") {
                        logger.verbose("service %s has no priority, using default priority", newService._id);
                        priority = getDefaultPriority(type);
                    }

                    if (matchedService) {
                        serviceMatched = true;
                        content = {
                            id: matchedService.id,
                            metadata: newService.metadata
                        };
                        content.metadata.priority = priority;
                    }
                    else {
                        serviceMatched = false;
                        content = newService;
                        content.metadata.priority = priority;
                    }

                    // set priority if not exist


                    return {
                        serviceMatched: serviceMatched,
                        type: getTableName(type),
                        content: content
                    }
                }

                logger.verbose("reformating service with type %s", type);

                var services = u.map(newServices, function(item) {
                    // NOTE: key = service type, value: array of actual service data
                    return reformat(item, existingServices, type);
                })

                logger.verbose("%s for car %s reformatted", type, carId);
                // logger.verbose(services)

                return services;
            }

            if (!services || services.length <= 0) {
                // logger.verbose("no service history record wth type %s found for car %s, skipping", type, carId);
                return [];
            }

            logger.verbose("saving %s %s for car %s", services.length, type, carId);

            var type = type;
            var promises = [
                getExistingServices(type, services),
                promise.resolve(services)
            ]

            return promise.all(promises).spread(function(existingServices, newServices) {
                return getReformattedService(existingServices, newServices, type);
            });
        }
        function doSave(newServices) {
            function saveByModelName(payloads, modelName) {
                function setRelations(services) {
                    function setApprovedEdmundsServiceRelation(service) {
                        function getEdmundsService(edmundsServiceId) {
                            return SequelizeModels.service_edmunds.findOne({
                                where: { id: edmundsServiceId }
                            }).then(function(result) {
                                if (!result) {
                                    logger.info("edmunds service %s not found", edmundsServiceId);
                                    return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
                                }
                                else {
                                    return result.dataValues;
                                }
                            })
                        }
                        function getapprovedService(edmundsService) {
                            return SequelizeModels.service_edmunds_approved.findOne({
                                attributes: [
                                    ["id", "id"],
                                    ["priority", "priority"]
                                ],
                                where: {
                                    item: edmundsService.item,
                                    action: edmundsService.action
                                }
                            }).then(function(result) {
                                if (result) {
                                    result = result.dataValues;
                                }
                                return result;
                            })
                        }
                        function removeServiceRecord(issueId) {
                            // delete row in car_service
                            SequelizeModels.car_service.destroy({ where: { id: issueId }})
                            .then(function() {
                                logger.debug("service record %s deleted", issueId);
                            })
                        }
                        function updateServices(issueId, edmundsServiceId, approvedService) {
                            // update priority in car_service
                            // update id_service_edmunds_approved in service_edmunds
                            var approvedServiceId = approvedService.id;
                            var priority = approvedService.priority;

                            logger.debug("updating priority of service %s to %s", issueId, priority);
                            logger.debug("updating approved service id of edmunds service %s to %s", edmundsServiceId, approvedServiceId);

                            var promises = [];
                            promises.push(
                                SequelizeModels.car_service.update(
                                    { priority: approvedService.priority },
                                    { where: {id: issueId }}
                                ).then(function() {
                                    logger.debug("priority of service record %s updated to %s", issueId, priority);
                                })
                            );

                            if (typeof(priority) !== "number") {
                                logger.info("approved service %s has no priority, skipping", approvedServiceId);
                            }
                            else {
                                promises.push(
                                    SequelizeModels.service_edmunds.update(
                                        { id_service_edmunds_approved: approvedServiceId },
                                        { where: { id: edmundsServiceId }}
                                    ).then(function() {
                                        logger.debug("approved service id of edmunds service %s updated to %s", edmundsServiceId, approvedServiceId);
                                    })
                                );
                            }

                            return promise.all(promises).then(function() {
                                logger.verbose("edmunds service relation of issue %s set", issueId);
                            });
                        }

                        var issueId = service.id;
                        var edmundsServiceId = service.id_service_edmunds;

                        return getEdmundsService(edmundsServiceId).then(function(edmundsService) {
                            return getapprovedService(edmundsService);
                        }).then(function(approvedService) {
                            if (!approvedService) {
                                logger.info("no approved service found for edmunds service %s, removing service record %s", edmundsServiceId, issueId);
                                return removeServiceRecord(issueId);
                            }
                            else {
                                return updateServices(issueId, edmundsServiceId, approvedService);
                            }
                        })
                    }

                    return promise.all(u.map(services, function(service) {
                        logger.verbose("setting relaitons for service %s", service.id);
                        if (typeof(service.id_service_edmunds) === "number") {
                            // TODO
                            logger.debug("setting edmunds service relations");
                            return setApprovedEdmundsServiceRelation(service);
                        }
                        else {
                            return promise.resolve();
                        }
                    }));
                }

                logger.debug("saving record into %s for car %s, payloads: %s", modelName, carId, JSON.stringify(payloads));
                var modelName = modelName;
                return SequelizeModels[modelName].bulkCreate(payloads, {
                    returning: true
                }).then(function(result) {
                    var result = result;
                    if (result) {
                        result = u.map(result, function(item) { return item.dataValues; });
                    }
                    return setRelations(result).then(function() {
                        return result;
                    })
                })
            }
            function saveMatchedServices(services) {
                function getPayload(service, type) {
                    // returns payload of single service
                    function getForeignKeyColumnByType(type) {
                        var result = undefined;
                        switch(type) {
                            case "service_edmunds":
                            case "service_customized":
                            case "service_archive":
                            case "recall_recallmasters":
                            case "dtc":
                                result = util.format("id_%s", type);
                                break;
                            default:
                                logger.info("invalid service type when saving service history: %s", type);
                                result = null;
                                break;
                        }
                        return result;
                    }

                    var result = {};

                    var foreignKey = getForeignKeyColumnByType(type);
                    if (!foreignKey) {
                        result = null;
                    }
                    else {
                        result[getForeignKeyColumnByType(type)] = service.content.id;
                        result.id_car = carId;
                        result.mileage = service.content.metadata.mileage;
                        result.priority = service.content.metadata.priority;
                        result.done_at = service.content.metadata.doneAt;
                        result.status = "done"; // default for service that are done

                        if (type === "dtc") {
                            // no way to track whether the dtc is pending anyway
                            // i.e. that info was discarded when saving dtc in history in Parse
                            result.dtc_is_pending = false;
                        }
                    }

                    return result;
                }

                var payloads = u.map(services, function(service) {
                    return getPayload(service, service.type);
                })

                payloads = u.filter(payloads, function(item) {
                    return (!u.isEmpty(item)); // remove null or undefined
                })

                logger.verbose("payloads of matched services:", payloads);

                if (payloads.length > 0) {
                    logger.verbose("saving %s service history records for car %s", newServices.length, carId);
                    return saveByModelName(payloads, "car_service");
                }
                else {
                    logger.debug("no new service history records to save for car %s, skipping", carId);
                }
            }
            function saveServicesAsRecord(services) {
                function getPayloads(services) {
                    // payloads of service_archive bulk create
                    function getPayload(service) {
                        var result = undefined;
                        logger.debug("raw service archive record: %s", JSON.stringify(service));
                        if (!service.content.metadata || u.isEmpty(service.content.metadata.rawRecord)) {
                            logger.info("no raw record found for service %s of car %s, skipping",
                                service.content._id, carId
                            );
                            result = null;
                        }
                        else {
                            result = service.content.metadata.rawRecord;
                            result.mileage = service.content.metadata.mileage;
                            result.priority = service.content.metadata.priority;
                        }
                        return result;
                    }

                    var payloads = u.map(services, function(service) {
                        return getPayload(service);
                    })
                    payloads = u.filter(payloads, function(item) {
                        return (!u.isEmpty(item)); // remove null or undefined
                    })

                    return payloads;
                }
                function saveArchive(payloads) {
                    // returns the new payloads for car_service
                    logger.verbose("payload of service_archive:", payloads)
                    return saveByModelName(payloads, "service_archive");
                }
                function getExtendedServices(newServices, servicesInDB) {
                    var servicesInDB = servicesInDB;
                    return u.map(newServices, function(newService) {
                        // NOTE: no error handling to check whether findWhere returns null.
                        // it shouldn't happen.
                        var whereClause = {};
                        if (newService.content.metadata.rawRecord.item) {
                            whereClause.item = newService.content.metadata.rawRecord.item;
                        }
                        if (newService.content.metadata.rawRecord.action) {
                            whereClause.action = newService.content.metadata.rawRecord.action;
                        }
                        if (newService.content.metadata.rawRecord.description) {
                            whereClause.description = newService.content.metadata.rawRecord.description;
                        }
                        var matchedService = u.findWhere(servicesInDB, whereClause);
                        logger.verbose("service matched:", matchedService)
                        newService.id = matchedService.id;
                        return newService;
                    })
                }
                function getNewPayloads(services) {
                    // payloads of bulk create in car_service
                    return u.map(services, function(service) {
                        return {
                            id_car: carId,
                            mileage: service.content.metadata.mileage,
                            priority: service.content.metadata.priority,
                            done_at: service.content.metadata.doneAt,
                            status: "done",
                            id_service_archive: service.id
                        }
                    })
                }

                var payloads = getPayloads(services);
                var newServices = services;

                if (payloads.length > 0) {
                    logger.debug("saving %s service archive records for car %s", services.length, carId);
                    return saveArchive(payloads).then(function(servicesInDB) {
                        logger.verbose("# of service archive records created: %s", servicesInDB.length);
                        return getNewPayloads(getExtendedServices(newServices, servicesInDB));
                    }).then(function(payloads) {
                        logger.verbose("payloads of car_service:", payloads);
                        return saveByModelName(payloads, "car_service");
                    })
                }
                else {
                    logger.debug("no new service archive records to save for car %s, skipping", carId);
                }
            }

            logger.verbose("# of services to be saved for car %s: %s", carId, newServices.length);

            var matchedServices = u.filter(newServices, function(item) {
                return (!!item.serviceMatched);
            })
            var archivedServices = u.filter(newServices, function(item) {
                return (!item.serviceMatched);
            })

            var promises = [
                saveMatchedServices(matchedServices),
                saveServicesAsRecord(archivedServices)
            ]

            return promise.all(promises);
        }

        // workflow:
        // 1    get service from DB
        // 2-1  if service exists, add new row in car_service
        // 2-2  otherwise, create new row in service_archive, then add new row in car_service

        var services = car.serviceHistory;
        var carId = car.basicInfo.id;

        return promise.all([
            getServiceByType("serviceInterval", services.serviceInterval, carId),
            getServiceByType("serviceFixed", services.serviceFixed, carId),
            getServiceByType("edmundsService", services.edmundsService, carId),
            getServiceByType("recall", services.recall, carId),
            getServiceByType("dtc", services.dtc, carId),
        ]).then(function(services) {
            services = u.flatten(services, true);
            return doSave(services);
        })
    }

    var promises = u.map(data.cars, function(item) {
        return saveForEach(item);
    })
    return promise.all(promises);
}

function saveActiveServices(data) {
    function getPayloads(cars) {
        function reformat(cars) {
            function getDefaultPriority(type) {
                switch (type) {
                    case "serviceFixed":
                    case "serviceInterval":
                    case "edmundsService":
                        result = 1;
                        break;
                    case "recall":
                    case "pendingDTC":
                    case "storedDTC":
                        result = 4;
                        break;
                }
                return result;
            }
            function getRawRecord(serviceDetail, type) {
                var result = undefined;
                switch (type) {
                    case "serviceInterval":
                    case "serviceFixed":
                    case "edmundsService":
                        result = {
                            item: serviceDetail.item,
                            action: serviceDetail.action,
                            description: serviceDetail.itemDescription
                        }
                        break;
                    case "recall":
                        result = {
                            item: serviceDetail.name,
                            description: util.format("%s\n%s", serviceDetail.risk, serviceDetail.remedy)
                        }
                        break;
                    case "pendingDTC":
                        result = {
                            item: serviceDetail.dtcCode,
                            description: serviceDetail.description,
                        }
                        break;
                    case "storedDTC":
                        result = {
                            item: serviceDetail.dtcCode,
                            description: serviceDetail.description,
                        }
                        break;
                }
                return result;
            }
            // returns services reformatted as array of:
            // {
            //     carId: <carId>,
            //     content: { <raw content> },
            //     type: <setviceType>,
            //     metadata: {...},
            //     rawRecord: {...}
            // }
            return u.map(cars, function(car) {
                var carId = car.basicInfo.id;
                var shopId = car.shop.id;
                var allServices = {
                    serviceInterval: car.services.intervalMileageServices,
                    serviceFixed: car.services.fixedMileageServices,
                    edmundsService: car.services.edmundsService,
                    pendingDTC: car.DTCs.pendingDTCs,
                    storedDTC: car.DTCs.storedDTCs,
                    recall: car.activeRecalls.recalls
                }

                return u.mapObject(allServices, function(services, type) {
                    var type = type;
                    return u.map(services, function(service) {
                        logger.debug("curr service: %s", JSON.stringify(service))
                        var idColumnName = undefined;
                        var result = {};
                        var priority = undefined;
                        result.metadata = {
                            carId: carId,
                            type: type,
                        };

                        // set whereClause and priority
                        switch (type) {
                            case "serviceInterval":
                            case "serviceFixed":
                                idColumnName = "id_service_customized";
                                result.whereClause = {
                                    id_shop: shopId,
                                    item: service.item,
                                    action: service.action
                                };
                                break;
                            case "edmundsService":
                                idColumnName = "id_service_edmunds";
                                result.whereClause = {
                                    edmunds_id: service.edmundsId
                                };
                                priority = service.priority;
                                break;
                            case "pendingDTC":
                            case "storedDTC":
                                idColumnName = "id_dtc";
                                result.whereClause = {
                                    dtc_code: service.dtcCode
                                }
                                priority = 4;
                                break;
                            case "recall":
                                idColumnName = "id_recall_recallmasters";
                                priority = 4;
                                result.whereClause = {
                                    nhtsa_id: service.nhtsaID,
                                    oem_id: service.oemID,
                                    name: service.name
                                };
                                break;
                        }

                        if (!priority) {
                            logger.debug("service %s has no priority, using default priority", service._id);
                            priority = getDefaultPriority(type);
                        }

                        logger.debug("priority of service %s: %s", service._id, service.priority);

                        result.metadata.priority = priority;
                        result.metadata.idColumnName = idColumnName;
                        result.rawRecord = getRawRecord(service, type);
                        return result;
                    })
                })
            })

        }
        function getExistingServices(services) {
            function getWhereClauses(services) {
                var rawClauses = u.mapObject(services, function(value, type) {
                    return u.map(value, function(service) {
                        return service.whereClause
                    })
                });

                return {
                    service_customized: u.union(rawClauses.serviceInterval, rawClauses.seviceFixed),
                    service_edmunds: rawClauses.edmundsService,
                    dtc: u.union(rawClauses.storedDTC, rawClauses.pendingDTC),
                    recall_recallmasters: rawClauses.recall
                }
            }
            function getPromises(whereClauses) {
                return u.mapObject(whereClauses, function(whereClause, type) {
                    if (!u.isEmpty(whereClause)) {
                        return SequelizeModels[type].findAll({ where: {$or: whereClause} });
                    }
                    else {
                        return undefined;
                    }

                })
            }

            var whereClauses = getWhereClauses(services);
            var promises = u.filter(getPromises(whereClauses), function(item) {
                return u.isObject(item);
            });

            logger.debug("whereClauses: %s", JSON.stringify(whereClauses));

            return promise.all(promises).then(function(results) {
                return u.flatten(
                    u.map(results, function(result) {
                        return u.map(
                            result, function(item) {
                                return item.dataValues;
                            });
                        }
                    )
                )
            });
        }
        function getExtendedServices(newServices, existingServices) {
            // logger.info("new services: %s", JSON.stringify(newServices));
            // logger.info("existing services: %s", JSON.stringify(existingServices));

            var existingServices = existingServices;
            return u.mapObject(newServices, function(services, type) {
                return u.map(services, function(service) {
                    var matchedService = u.findWhere(existingServices, service.whereClause);
                    var isMatchedServiceFound = (!!matchedService);

                    service.metadata.isMatchedServiceFound = isMatchedServiceFound;

                    if (isMatchedServiceFound) {
                        logger.debug("matched service found, where clause: %s", JSON.stringify(service.whereClause));
                        service.metadata.matchedServiceId = matchedService.id;
                    }
                    else {
                        logger.debug("no service matches for where clause: %s", JSON.stringify(service.whereClause));
                    }

                    return service;
                })
            })
        }
        function group(allServices) {
            allServices = u.flatten(
                u.map(allServices, function(services) {
                    return u.values(services);
                })
            );

            return u.groupBy(allServices, function(item) {
                return item.metadata.type;
            })
        }
        function doGet(allServices) {
            function regroup(allServices) {
                // split all services into a json of 2 arrays, like
                // { matchedServices: [...], archivedServices: [...] }

                allServices = u.flatten(
                    u.map(allServices, function(services) {
                        return u.values(services);
                    })
                );

                return {
                    matchedServices: u.filter(allServices, function(service) {
                        return service.metadata.isMatchedServiceFound;
                    }),
                    archivedServices: u.filter(allServices, function(service) {
                        return !service.metadata.isMatchedServiceFound;
                    })
                }
            }
            function getMatchedServicesPayloads(services) {
                return u.map(services, function(service) {
                    var result = {};
                    result["id_car"] = service.metadata.carId;
                    result["priority"] = service.metadata.priority;
                    result["status"] = "new"; // default
                    result[service.metadata.idColumnName] = service.metadata.matchedServiceId;

                    if (service.metadata.type = "pendingDTC") {
                        result["dtc_is_pending"] = true;
                    }
                    if (service.metadata.type = "storedDTC") {
                        result["dtc_is_pending"] = false;
                    }

                    return result;
                })
            }
            function getServicesRecordPayloads(services) {
                function saveArchives(payloads) {
                    logger.debug("saving #%s service archive records for cars belong to user %s", payloads.length, userId);
                    return SequelizeModels.service_archive.bulkCreate(payloads, { returning: true })
                    .then(function(result) {
                        logger.verbose("# of service archive record for cars belong to user %s created: %s", userId, result.length);

                        if (result) {
                            result = u.map(result, function(item) { return item.dataValues; });
                        }
                        return result;
                    });
                }
                function getPayloads(allServices, serviceArchives) {
                    var result = u.map(allServices, function(service) {
                        var matchedService = u.findWhere(serviceArchives, service.rawRecord);
                        if (matchedService) {
                            service.metadata.idColumnName = "id_service_archive";
                            service.metadata.matchedServiceId = matchedService.id;
                        }
                        else {
                            service = null;
                        }
                        return service;
                    });

                    result = u.filter(result, function(item) {
                        return (!!item); // remove null or undefined
                    })

                    return u.map(result, function(service) {
                        var result = {};
                        result["id_car"] = service.metadata.carId;
                        result["priority"] = service.metadata.priority;
                        result["status"] = "new"; // default
                        result[service.metadata.idColumnName] = service.metadata.matchedServiceId;
                        return result;
                    })

                    logger.verbose("# of service archive payloads: %s", result.length);
                    return result;
                }

                var payloads = u.map(services, function(service) {
                    // enforce that result is a new json
                    var result = JSON.parse(JSON.stringify(service.rawRecord));
                    result.priority = service.metadata.priority;
                    result.details = service.metadata; // not going to be used, probably
                    return result;
                });

                return saveArchives(payloads).then(function(serviceArchives) {
                    return getPayloads(allServices, serviceArchives);
                })
            }

            var regroupedServices = regroup(allServices);
            allServices = u.flatten(u.map(allServices, function(services) {
                return u.values(services);
            }));
            return promise.all([
                promise.resolve(getMatchedServicesPayloads(regroupedServices.matchedServices)),
                promise.resolve(getServicesRecordPayloads(regroupedServices.archivedServices))
            ]).then(function(results) {
                return {
                    allServices: allServices,
                    allPayloads: {
                        matchedServices: results[0],
                        archivedServices: results[1]
                    }
                }
            })
        }

        var newServices = group(reformat(cars));
        var existingServices = getExistingServices(newServices);

        var promises = [ promise.resolve(newServices), promise.resolve(existingServices) ];

        return promise.all(promises).spread(function(newServices, existingServices) {
            return getExtendedServices(newServices, existingServices);
        }).then(function(newServices) {
            return doGet(newServices);
        })
    }
    function doSave(allServices, allPayloads) {
        function saveMatchedServices(payloads) {
            return SequelizeModels.car_service.bulkCreate(payloads, { returning: true })
            .then(function(result) {
                logger.verbose("# of matched services saved for cars belong to user %s: %s", userId, result.length);
                if (result) {
                    result = u.map(result, function(result) { return result.dataValues; });
                }
                return result;
            });
        }
        function saveServicesAsRecord(payloads) {
            return SequelizeModels.car_service.bulkCreate(payloads, { returning: true })
            .then(function(result) {
                logger.verbose("# of archived services saved for cars belong to user %s: %s", userId, result.length);
                if (result) {
                    result = u.map(result, function(result) { return result.dataValues; });
                }
                return result;
            });
        }
        function setRelations(services) {
            function setApprovedEdmundsServiceRelation(service) {
                function getEdmundsService(edmundsServiceId) {
                    return SequelizeModels.service_edmunds.findOne({
                        where: { id: edmundsServiceId }
                    }).then(function(result) {
                        if (!result) {
                            logger.info("edmunds service %s not found", edmundsServiceId);
                            return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
                        }
                        else {
                            return result.dataValues;
                        }
                    })
                }
                function getapprovedService(edmundsService) {
                    return SequelizeModels.service_edmunds_approved.findOne({
                        attributes: [
                            ["id", "id"],
                            ["priority", "priority"]
                        ],
                        where: {
                            item: edmundsService.item,
                            action: edmundsService.action
                        }
                    }).then(function(result) {
                        if (result) {
                            result = result.dataValues;
                        }
                        return result;
                    })
                }
                function removeServiceRecord(issueId) {
                    // delete row in car_service
                    SequelizeModels.car_service.destroy({ where: { id: issueId }})
                    .then(function() {
                        logger.debug("service record %s deleted", issueId);
                    })
                }
                function updateServices(issueId, edmundsServiceId, approvedService) {
                    // update priority in car_service
                    // update id_service_edmunds_approved in service_edmunds
                    var approvedServiceId = approvedService.id;
                    var priority = approvedService.priority;

                    logger.debug("updating priority of service %s to %s", issueId, priority);
                    logger.debug("updating approved service id of edmunds service %s to %s", edmundsServiceId, approvedServiceId);

                    var promises = [];
                    promises.push(
                        SequelizeModels.car_service.update(
                            { priority: approvedService.priority },
                            { where: {id: issueId }}
                        ).then(function() {
                            logger.debug("priority of service record %s updated to %s", issueId, priority);
                        })
                    );

                    if (typeof(priority) !== "number") {
                        logger.info("approved service %s has no priority, skipping", approvedServiceId);
                    }
                    else {
                        promises.push(
                            SequelizeModels.service_edmunds.update(
                                { id_service_edmunds_approved: approvedServiceId },
                                { where: { id: edmundsServiceId }}
                            ).then(function() {
                                logger.debug("approved service id of edmunds service %s updated to %s", edmundsServiceId, approvedServiceId);
                            })
                        );
                    }

                    return promise.all(promises).then(function() {
                        logger.verbose("edmunds service relation of issue %s set", issueId);
                    });
                }

                var issueId = service.id;
                var edmundsServiceId = service.id_service_edmunds;

                return getEdmundsService(edmundsServiceId).then(function(edmundsService) {
                    return getapprovedService(edmundsService);
                }).then(function(approvedService) {
                    if (!approvedService) {
                        logger.info("no approved service found for edmunds service %s, removing service record %s", edmundsServiceId, issueId);
                        return removeServiceRecord(issueId);
                    }
                    else {
                        return updateServices(issueId, edmundsServiceId, approvedService);
                    }
                })
            }

            return promise.all(u.map(services, function(service) {
                logger.verbose("setting relaitons for service %s", service.id);
                if (typeof(service.id_service_edmunds) === "number") {
                    // TODO
                    logger.debug("setting edmunds service relations");
                    return setApprovedEdmundsServiceRelation(service);
                }
                else {
                    return promise.resolve();
                }
            }));
        }

        logger.verbose("saving %s active services of cars belong to user %s",allServices.length, userId);
        return promise.all([
            saveMatchedServices(allPayloads.matchedServices),
            saveServicesAsRecord(allPayloads.archivedServices)
        ]).then(function(results) {
            var matchedServicesResult = results[0];
            setRelations(matchedServicesResult);
        }).then(function() {
            logger.verbose("all active services saved for user %s", userId);
        })

        // return models.car_service.bulkCreate(payloads).then(function(result) {
        //     if (!result) {
        //         result = [];
        //     }
        //     logger.info("# of services added for all cars: %s", result.length);
        // })
    }

    var userId = data.user.newId;
    return getPayloads(data.cars).then(function(result) {
        return doSave(result.allServices, result.allPayloads);
    });
    // console.log(data);
}

// console.log(util.inspect(stub, { "depth": null, "colors": true }));
// saveCars(stub).then(function() { updateServices(stub); })
// saveServiceHistory(stub);
// saveActiveServices(stub)
// saveActiveServices(stub).then(function(result) {
//     // console.log(util.inspect(stub, { "depth": null, "colors": true }));
//     console.log(JSON.stringify(result))
// })
