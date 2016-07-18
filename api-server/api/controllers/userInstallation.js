var promise = require("bluebird");
var u = require('underscore');
var util = require('util');
var http = require('https');

var logger = require('../../logger');
var helper = require('../helpers');
var models = require('../../models');

var sequelize = models.sequelize;

module.exports = {
    createUserInstallation: createUserInstallation
};

function createUserInstallation(userId, installationId) {
    // NOTE: mimics the behaviour of sequelize's upsert:
    // returns true if event was insert, otherwise returns false;

    var doInsert = function () {
        return models.user_installation.create({
            installation_id: installationId,
            id_user: userId
        }).then(function (result) {
            return true;
        }).catch(function(error) {
            if (error.name === "SequelizeUniqueConstraintError") {
                logger.verbose("installation record for user %s already exists", userId);
            }
            else {
                return promise.reject(error);
            }
        })
    }

    var doUpdate = function () {
        // NOTE: not used
        return models.user_installation.update(
            {
                installation_id: installationId
            },
            {
                where: {
                    id_user: userId
                }
            })
            .then(function (result) {
                // return true if some rows updated
                if (result[0] >= 1) {
                    logger.warn("more than 1 row updated when upserting table user_installation");
                    return false;
                }
                return true;
            })
    }

    return doInsert().then(function() {
            logger.info("insert userId %s with installationId %s successfully", userId, installationId);
    // return doInsert().then(function (result) {
    //     if (!result) {
    //         logger.info("update userId %s with installationId %s successfully", userId, installationId);
    //     } else {
    //         logger.info("insert userId %s with installationId %s successfully", userId, installationId);
    //         return doInsert();
    //     }
    }).catch(function (error) {
        if (!error.nonce) {
            logger.warn(error);
            logger.warn("error when creating issue: %s, %s", error.name, error.message);
            return promise.reject(error);
        }
    })
}
