var promise = require('bluebird');
var u = require('underscore');

var controllers = require('./controllers');

var logger = controllers.logger;
var helper = controllers.helper;
var parseModels = controllers.models;
var sqlModels = contorller.sequelizeModels;

module.exports = {
    carMigration: carMigration
};

function carMigration(userId, parseObjectId) {
    function saveCar(payload) {
        return sqlModels.car.save(payload);
    }
    function getEdmundsService(carId) {
        return controllers.utilityController.checkedmundsServiceByCarId(carId);
    }
    // function getRecalls(carId, )
}
