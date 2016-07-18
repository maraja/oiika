var promise = require('bluebird');
var u = require('underscore');
var util = require('util');
var moment = require('moment');

var controllers = require('./controllers');
var config = require('./config');

var logger = controllers.logger;
var helper = controllers.helper;
var models = controllers.models;
var SequelizeModels = controllers.sequelizeModels;

module.exports = {
    getUser: getUser,
    getCars: getCars,
    getShops: getShops,
    getServiceHistory: getServiceHistory,
    getActiveRecalls: getActiveRecalls
};

function getUser(userObjectId) {
    return models.user.findOne({
        _id: userObjectId
    })
}
function getCars(userObjectId) {
    function getCar(carObject) {
        function getBasicInfo(carObject) {
            return promise.resolve({
                vin: carObject.VIN,
                mileage_base: carObject.baseMileage,
                mileage_total: carObject.totalMileage,
                car_make: carObject.make,
                car_model: carObject.model,
                car_year: carObject.year,
                car_trim: carObject.trim_level,
                car_tank: carObject.tank_size,
                car_engine: carObject.engine,
                mileage_city: carObject.city_mileage,
                mileage_highway: carObject.highway_mileage,
                created_at: carObject._created_at,
                updated_at: carObject._updated_at,
                relations: {
                    currentCar: carObject.currentCar,
                    scannerId: carObject.scannerId,
                    userObjectId: carObject.owner,
                    shopObjectId: carObject.dealership
                }
            })
        }
        function getDTCs(carObject) {
            var storedDTCs = carObject.storedDTCs;
            var pendingDTCs = carObject.pendingDTCs;

            for (var i = 0; i < storedDTCs.length; i++) {
                storedDTCs[i] = { "dtcCode": storedDTCs[i] }
            }
            for (var i = 0; i < pendingDTCs.length; i++) {
                pendingDTCs[i] = { "dtcCode": pendingDTCs[i] }
            }

            storedDTCs = (storedDTCs.length > 0)
                            ? models.dtc.find().or(storedDTCs)
                            : promise.resolve([]);

            pendingDTCs = (pendingDTCs.length > 0)
                            ? models.dtc.find().or(pendingDTCs)
                            : promise.resolve([]);

            var promises = [ storedDTCs, pendingDTCs ];

            return promise.all(promises).spread(function(storedDTCObjects, pendingDTCObjects) {
                return {
                    storedDTCs: storedDTCObjects,
                    pendingDTCs: pendingDTCObjects
                }
            })
        }
        function getServices(carObject) {
            function getServiceDetails(modelName, serviceList) {
                if (serviceList && serviceList.length > 0) {
                    return models[modelName].find().or(u.map(serviceList, function(item) {
                        return { _id: item };
                    }));
                }
                else {
                    return promise.resolve([]);
                }
            }

            var promises = [
                getServiceDetails("edmundsService", carObject.pendingEdmundServices),
                getServiceDetails("serviceFixed", carObject.pendingFixedServices),
                getServiceDetails("serviceInterval", carObject.pendingIntervalServices)
            ]

            return promise.all(promises).then(function(results) {
                var result = {
                    edmundsService: results[0],
                    fixedMileageServices: results[1],
                    intervalMileageServices: results[2]
                }
                return result;
            })
        }
        function getShop(carObject) {
            logger.verbose("finding shop for with objectId %s for car %s", carObject.dealership, carObjectId);
            return models.shop.findOne({
                _id: carObject.dealership
            }).then(function(shopObject) {
                var shopName = shopObject.name;
                logger.verbose("finding shop for car %s with name '%s'", carObjectId, shopName);
                return SequelizeModels.shop.findOne({
                    where: { name: shopName }
                }).then(function(result) {
                    if (!result) {
                        logger.warn("shop %s for car %s is not found", shopName, carObjectId);
                        result = {}; // to avoid null value in later processing
                    }
                    else {
                        result = result.dataValues;
                        logger.verbose("shop found for car %s: %s", carObjectId, result.id);
                    }
                    return result;
                })
            });
        }
        var carObjectId = carObject._id;
        var promises = [
            getBasicInfo(carObject),
            getDTCs(carObject),
            getServices(carObject),
            getShop(carObject)
        ];
        return promise.all(promises).spread(function(basicInfo, DTCs, services, shop) {
            return {
                carObjectId: carObjectId,
                basicInfo: basicInfo,
                DTCs: DTCs,
                services: services,
                shop: shop,
                relations: basicInfo.relations
            }
        })
    }

    // returns:
    // basic car info
    // DTCs: { activeDtcs: [...], storedDtcs: [...] }
    // active services: { edmundsService: [..], dealershipServices: [...] }
    logger.debug("getting car from Parse for user %s", userObjectId);
    return models.car.find({
        owner: userObjectId
    }).then(function(results) {
        var promises = [];
        for (var i = 0; i < results.length; i++) {
            promises.push(getCar(results[i]));
        }

        return promise.all(promises);
    }).catch(function(error) {
        logger.info("error when getting car:");
        logger.info(error.stack);
    })
}
function getShops() {
    return models.shop.find().then(function(result) {
        return JSON.parse(JSON.stringify(result));
    })
}
function getServiceHistory(carObjectId) {
    function getServices(carObjectId) {
        return models.serviceHistory.find({
            carId: carObjectId
        })
    }
    function processRawServices(rawServices, carObjectId) {
        function setMetadata(rawServices) {
            function getMileage(rawService) {
                return Math.max(rawService.mileageSetByUser, rawService.mileage);
            }
            function getDoneAt(rawService) {
                var createdAt = moment(rawService._created_at).unix();
                var doneAtString = rawService.userMarkedDoneOn;
                var result = undefined;
                var offset = 0; // in seconds

                if (!doneAtString) {
                    // empty string or doesnt exist;
                    offset = 0;
                }
                else {
                    if (doneAtString.match(/recently/i)) {
                        offset = 0;
                    }
                    else if (doneAtString.match(/2 week/i)) {
                        offset = 2*7*24*3600;
                    }
                    else if (doneAtString.match(/a month/i)) {
                        offset = 30*24*3600;
                    }
                    else if (doneAtString.match(/2 to 3 month/i)) {
                        offset = (2+3)/2*30*24*3600;
                    }
                    else if (doneAtString.match(/3 to 6 month/i)) {
                        offset = (3+6)/2*30*24*3600;
                    }
                    else if (doneAtString.match(/6 to 12 month/i)) {
                        offset = (6+12)/2*30*24*3600;
                    }
                    else {
                        logger.info("invalid userMarkedDoneOn string: %s", doneAtString);
                        offset = 0;
                    }
                }

                result = moment.unix(createdAt - offset).toDate();
                return result;
            }

            return u.map(rawServices, function(item)  {
                item.metadata = {
                    mileage: getMileage(item),
                    doneAt: getDoneAt(item)
                }
                return item;
            });
        }
        function getServiceDetails(rawServices) {
            function reformat(rawService) {
                function isValidDtcCode(dtcCode) {
                    var regex = config.service.dtcCodeRegex;
                    return regex.test(dtcCode);
                }

                var type = rawService.type;
                var serviceId = rawService.serviceId;
                var serviceType;
                var findBy;

                if (type === 0) {
                    serviceType = "edmundsService";
                    findBy = { "_id": rawService.serviceObjectId };
                }
                else if (type === 1 ) {
                    serviceType = "serviceFixed";
                    findBy = { "_id": rawService.serviceObjectId };
                }
                else if (type === 2) {
                    serviceType = "serviceInterval";
                    findBy = { "_id": rawService.serviceObjectId };
                }
                else {
                    if (serviceId == 123) {
                        serviceType = "dtc";
                        if (isValidDtcCode(rawService.serviceObjectId)) {
                            findBy = { "dtcCode": rawService.serviceObjectId };
                        }
                        else {
                            findBy = { "_id": rawService.serviceObjectId };
                        }
                    }
                    else if (serviceId == 124) {
                        serviceType = "recall";
                        findBy = { "_id": rawService.serviceObjectId };
                    }
                    else if ((typeof(serviceId) === "undefined") && (typeof(type) === "undefined")) {
                        // dtc
                        serviceType = "dtc";
                        if (isValidDtcCode(rawService.serviceObjectId)) {
                            findBy = { "dtcCode": rawService.serviceObjectId };
                        }
                        else {
                            findBy = { "_id": rawService.serviceObjectId };
                        }
                    }
                    else {
                        logger.warn("unsupported serviceId: %s", serviceId);
                    }
                }

                return {
                    serviceType: serviceType,
                    findBy: findBy
                }
            }
            function group(services) {
                services = u.groupBy(services, function(item) {
                    return item.serviceType;
                })

                u.each(services, function(value, key) {
                    services[key] = u.map(value, function(item) {
                        return item.findBy;
                    })
                })

                return services;
            }
            function getServiceDetail(modelName, conditions) {
                if (typeof(conditions) === "object" && conditions.length > 0) {
                    return models[modelName].find().or(conditions);
                }
                else {
                    return promise.resolve([]);
                }
            }
            function getAllShops() {
                function getShopsFromParse() {
                    return models.shop.find();
                }
                function getShopsFromNewDB() {
                    return SequelizeModels.shop.findAll().then(function(result) {
                        return u.map(result, function(item) { return item.dataValues; });
                    });
                }
                function group(oldShops, newShops) {
                    return u.map(oldShops, function(item) {
                        var result = {};
                        result.oldId = item._id;
                        result.newId = u.findWhere(newShops, { name: item.name });
                        if (result.newId) {
                            result.newId = result.newId.id;
                        }
                        else {
                            result.newId = null;
                        }

                        return result;
                    })
                }
                return promise.all([ getShopsFromParse(), getShopsFromNewDB() ])
                .spread(function(oldShops, newShops) {
                    return group(oldShops, newShops);
                })
            }
            function getLinkedDetails(services, details) {
                // NOTE: services that wasn't matched will be removed here

                services = u.mapObject(services, function(value, key) {
                    var result = u.map(value, function(currService) {
                        var result = u.extend(currService, u.findWhere(details[key], currService));

                        if (result) {
                            // parse into json to mutate fields
                            result = JSON.parse(JSON.stringify(result));
                            if (u.contains([ "serviceInterval", "serviceFixed"], key)) {
                                logger.debug("update dealership info for service %s", result._id);
                                if (!result.dealership) {
                                    // no dealership found for that service
                                    result = null;
                                }
                                else {
                                    var matchedShop = u.filter(details.shops, function(item) {
                                        return (item.oldId === result.dealership)
                                    });
                                    if (matchedShop.length > 0) {
                                        matchedShop = matchedShop[0];
                                    }
                                    else {
                                        matchedShop = null;
                                    }
                                    result.dealership = matchedShop;
                                }
                            }
                        }
                        else {
                            result = null;
                        }

                        return result;
                    })

                    result = u.filter(result, function(item) {
                        return (!!item);
                    })
                    return result;
                })

                return services;
            }
            function getExtendedData(rawServices, serviceDetails) {
                // NOTE: there might be a bug that when 2 different type of services shares
                // the same objectId, the code may link the service with mismatched details
                // the code will link the first service found
                // it can be fixed by change code in reformat() function to extend
                // raw services instead of returning where clauses only.
                // if fixed in such way, getServiceDetail should also be updated
                function getMetadata(matchedRawService, serviceDetail, type) {
                    function getRawRecord(serviceDetail, type) {
                        function getContent(serviceDetail, type) {
                            // NOTE: result here is the content to be saved in record only table if service is not found
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
                                case "dtc":
                                    result = {
                                        item: serviceDetail.dtcCode,
                                        description: serviceDetail.description
                                    }
                                    break;
                            }
                            logger.debug("raw record for service %s: %s",
                                            serviceDetail._id, JSON.stringify(result)
                                        );

                            return result;
                        }

                        return getContent(serviceDetail, type);
                    }

                    var result = matchedRawService.metadata;
                    result.priority = serviceDetail.priority;

                    if (matchedRawService) {
                        logger.debug("raw service for service %s found, getting raw record", serviceDetail._id);
                        result.rawRecord = getRawRecord(serviceDetail, type);
                    }

                    return result;
                }

                return u.mapObject(serviceDetails, function(servicesByType, type) {
                    var type = type; // make it as global variable to make it accessible in getRawRecord();
                    return u.map(servicesByType, function(service) {
                        var result = undefined;
                        if (!service) {
                            result = null;
                        }
                        else {
                            var objectId = service._id;
                            var matchedRawService = undefined;
                            if (type === "dtc") {
                                var dtcCode = service.dtcCode;
                                matchedRawService = u.findWhere(rawServices, { serviceObjectId: objectId });
                                if (!matchedRawService) {
                                    matchedRawService = u.findWhere(rawServices, { serviceObjectId: dtcCode });
                                }
                            }
                            else {
                                matchedRawService = u.findWhere(rawServices, { serviceObjectId: objectId });
                            }

                            service.metadata = getMetadata(matchedRawService, service, type);
                            return service;
                        }

                        return result;
                    })
                })
            }
            var rarServices = rawServices;
            var formattedRawServices = [];

            for (var i = 0; i < rawServices.length; i++) {
                formattedRawServices.push(reformat(rawServices[i]));
            }

            formattedRawServices = group(formattedRawServices);

            var promises = [
                getServiceDetail('edmundsService', formattedRawServices["edmundsService"]),
                getServiceDetail('serviceFixed', formattedRawServices["serviceFixed"]),
                getServiceDetail('serviceInterval', formattedRawServices["serviceInterval"]),
                getServiceDetail('recallEntry', formattedRawServices["recall"]),
                getServiceDetail('dtc', formattedRawServices["dtc"]),
                getAllShops()
            ]

            return promise.all(promises).then(function(results) {
                var result = {
                    edmundsService:     results[0],
                    serviceFixed:       results[1],
                    serviceInterval:    results[2],
                    recall:             results[3],
                    dtc:                results[4],
                    shops:              results[5]
                };
                return result;
            }).then(function(details) {
                return getLinkedDetails(formattedRawServices, details);
            }).then(function(result) {
                logger.debug("linked data: ", result);
                return getExtendedData(rawServices, result);
            }).then(function(result) {
                var count = 0;
                u.each(result, function(item) {
                    count += item.length;
                });
                result.count = count;
                return result;
            })
        }

        logger.info("%s service history records found for car %s", rawServices.length, carObjectId);

        return getServiceDetails(setMetadata(rawServices));
    }

    var carObjectId = carObjectId; // make argument into global variable to local scope
    return getServices(carObjectId).then(function(rawServices) {
        rawServices = JSON.parse(JSON.stringify(rawServices)); // in order to modify object from mongoose
        return processRawServices(rawServices, carObjectId);
    }).then(function(result) {
        // filter out result
        logger.verbose("raw services for car %s", carObjectId);
        logger.verbose(result)
        logger.info("%s valid existing service history records found for car %s", result.count, carObjectId)
        delete result.count;
        return result;
    }).catch(function(error) {
        logger.info("error when getting service hisotry:");
        logger.info(error.stack);
    })

}
function getActiveRecalls(carObjectId) {
    // result:
    // { carObjectId: "objectId", recalls: [ "recallObjectId_0", "recallObjectId_1", ...] }
    function getPointer(collectionName, objectId) {
        return util.format("%s$%s", collectionName, objectId);
    }

    var carObjectId = carObjectId; // make argument into global variable to local scope
    var carPointer = getPointer("Car", carObjectId);

    logger.debug("getting recallMasters object for car %s", carObjectId);
    return models.recallMasters.findOne({
        _p_forCar: carPointer
    }).then(function(recallMastersObject) {
        if (!recallMastersObject) {
            logger.debug("no recall for car %s", carObjectId);
            return promise.resolve([]);
        }
        else {
            logger.debug("getting recalls for car %s", carObjectId);
            return models.recallEntry.find({
                _p_forRecallMasters: getPointer("RecallMasters", recallMastersObject._id)
            }).or([
                { state: "new" },
                { state: "pending" }
            ])
        }
    }).then(function(recalls) {
        logger.debug("%s recalls found for car %s", recalls.length, carObjectId)
        return {
            carObjectId: carObjectId,
            recalls: recalls
        };
    }).catch(function(error) {
        logger.info("error when getting active recalls:");
        logger.info(error.stack);
    })
}

// getCars("sPHvS8eRzV").then(function(result) {
//     console.log(util.inspect(result, {
//         "depth": null,
//         "colors": true
//     }))
// })
