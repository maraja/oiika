const u = require('underscore');
const promise = require('bluebird');
const util = require('util');

const logger = require('../../../logger');
const models = require('../../../models');
const helper = require('../../helpers');
var config = require('./config');


const sequelize = models.sequelize;

var saveFreezeData = function(attributes) {
    // NOTE: returns array of boolean of whether freeze data was saved and message, if it was not saved

    return models.scanner_data_freeze_data.create(attributes).then(function() {
        return { isSaved: true };
    }).catch(function(error) {
        logger.warn("error when creating freezeData record:", "unexpected error:", error.name);
        return { isSaved: false, message: error.message }; // replace \n for better print
    }).then(function(result) {
        return result;
    })
};

module.exports = {
    saveFreezeData: saveFreezeData
};
