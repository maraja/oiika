let dependency = require('../dependency');
let Parse = dependency.Parse;

function getPriorityById(serviceId) {
    return models.car_service.findOne({
        attributes: [
            ["priority", "priority"]
        ],
        where: {
            id_service_edmunds: serviceId
        }
    }).then(function(result) {
        if (!result) {
            result = {};
        } else {
            result = result.dataValues;
        }
        return result;
    })
};

function getCarInfoById(carId) {
    return models.car.findOne({
        attributes: [
            ["car_year", "carYear"],
            ["car_model", "carModel"],
            ["car_make", "carMake"],
            ["id_user", "userId"]
        ],
        where: {
            id: carId
        }
    }).then(function(result) {
        if (!result) {
            result = {};
        } else {
            result = result.dataValues;
        }
        return result;
    })
};

function getinstallationIdById(userId) {
    return models.user_installation.findOne({
        attributes: [
            ["installation_id", "installationId"]
        ],
        where: {
            id_user: userId
        }
    }).then(function(result) {
        if (!result) {
            result = "";
        } else {
            result = result.dataValues.installationId;
        }
        return result;
    })
};
