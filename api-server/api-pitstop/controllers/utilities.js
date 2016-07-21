var utilities = require('./utilityController');

module.exports = {
    sendServiceRequest: sendServiceRequest,
    serviceUpdateByCarId: serviceUpdateByCarId,
    checkRecallsByVin: checkRecallsByVin,
    checkRecallsByCarId: checkRecallsByCarId,
    checkEdmundsServicesByCarId: checkEdmundsServicesByCarId,
    sendSmoochEmail : sendSmoochEmail,
    getVehicleId: getVehicleId,
    pushHandler: utilities.pushHandler
};

function sendServiceRequest(req, res) {
    return utilities.serviceRequest.sendServiceRequest(req, res);
}

function checkRecallsByVin(vin) {
    return utilities.recallMasters.checkRecallsByVin(vin);
}

function checkRecallsByCarId(carId) {
    return utilities.recallMasters.checkRecallsByCarId(carId);
}

function checkEdmundsServicesByCarId(carId) {
    return utilities.edmunds.updateEdmundsServices(carId);
}

function serviceUpdateByCarId(carId) {
    return utilities.serviceUpdate.checkServicesByCarId(carId);
}

function sendSmoochEmail(req, res) {
    return utilities.smoochEmail.sendSmoochEmail(req, res);
}

function getVehicleId(carId) {
    return utilities.edmunds,getVehicleId(carId);
}
