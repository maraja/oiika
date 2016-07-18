var promise = require("bluebird");
var u = require('underscore');
var util = require('util');
var http = require('https');

var logger = require('../../logger');
var helper = require('../helpers');
var models = require('../../models');

var sequelize = models.sequelize;

module.exports = {
    createInstallation: createInstallation,
    getDeviceTokenById: getDeviceTokenById
};


function createInstallation(req, res) {
    var params = req.swagger.params;
    var data = params.installation.value;

    var validDeviceType = ['ios', 'android'];
    var validAppName = ['Pitstop', 'pitstop'];
    var validAppId = ['com.pitstop', 'pitstop.ansik.ios'];
    var validPushType = ['gcm', 'apn'];
    // var validation_fields = ["appIdentifier", "appName", "updatedAt", "deviceType", "installationId", "appVersion", "timeZone", "createdAt"];
    var validation_fields = ["deviceType", "installationId", "pushType", "deviceToken"];
    var message = '';
    
    
    

    // validations
    function validation(){
        u.forEach(validation_fields, function(field){
            if(!validation_fields[field] && validation_fields[field] === "" ){
                message = " must be a valid entry.";
                return false;
            }
        })
        if (!u.contains(validDeviceType, data.deviceType)){
            message = "deviceType must be a valid entry.";
            return false;
        }
        // if (!u.contains(validAppName, data.appName)){
        //     message = "appName must be a valid entry.";
        //     return false;
        // }
        // if (!u.contains(validAppId, data.appIdentifier)){
        //     message = "appIdentifier must be a valid entry.";
        //     return false;
        // }
        if (data.pushType && !u.contains(validPushType, data.pushType)){
            message = "pushType must be a valid entry.";
            return false;
        }
        return true;
    };

    // create record catching all errors.
    function doTransaction() {
        return sequelize.transaction(function(t) {
            console.log(data);
            return models.installation.create({
                installation_id: data.installationId,
                push_type: data.pushType,
                device_token: data.deviceToken,
                device_type: data.deviceType,
                app_version: data.appVersion
                // appName: data.appName,
                // updatedAt: data.updated_at,
                // parseVersion: '',
                // createdAt: '',
                // appIdentifier: '',
                // localeIdentifier: '',
                // timeZone: '',
                // badge: '',
                // channels: ''
            }, {
                transaction: t
            }).then(function(result) {
                return result;
            }, function(error) {
                logger.warn(error);
                switch(error.name) {
                    case "SequelizeDatabaseError":
                        message = error.message;
                        logger.info("error when creating installation: ", message);
                        var err = new Error();
                        err.nonce = true;
                        err.name = "TRANSACTION_ERROR";
                        err.message = message;
                        error = err;
                        break;

                    case "SequelizeForeignKeyConstraintError":
                        message = error.message;
                        logger.info("error when creating installation: ", message);
                        var err = new Error();
                        err.nonce = true;
                        err.name = "TRANSACTION_ERROR";
                        err.message = message;
                        error = err;
                        break;

                    default:
                        break;
                }
                if (!error.nonce) {
                    message = "internal db error";
                    logger.warn("error when creating installation: ", "unexpected error");
                    logger.warn(error);
                    var err = new Error();
                    err.nonce = true;
                    err.name = "TRANSACTION_ERROR";
                    err.message = message;
                    error = err;
                }
                helper.sendErrorResponse(res, error);
            })
        });
    };

    if (!validation()) {
        throw helper.makeError("INVALID_INPUT", message);
    } else {
        doTransaction().then(function(result) {
            res.json(result);
        }).catch(function(error) {
            if (!error.nonce) {
                logger.warn("error in POST /installation", "unexpected error");
                logger.warn(error.stack);
                error = helper.makeError("TRANSACTION_ERROR", "internal service error");
            }
            helper.sendErrorResponse(res, error);
        })
    }
}

function getDeviceTokenById(req, res) {
    var params = req.swagger.params;
    var id = params.id.value;

    models.installation.findOne({
        attributes: [
            ["device_token", "deviceToken"],
            ["device_type", "deviceType"]
        ],
        where: {
            id: id
        }
    }).then(function(result) {
        res.json(result);
    },function(error) {
        logger.warn("error in getDeviceTokenById: ", "unexpected error");
        logger.warn(error);

        var message = "internal db error";
        var err = helper.makeError("TRANSACTION_ERROR", message);
        helper.sendErrorResponse(res, err);
    });
}
