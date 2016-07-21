var promise = require("bluebird")
var request = require("request-promise");
var util = require("util");

var models = require("../../models/mongoose");
var config = require("./config");
var logger = require("../../../logger");
var helper = require("../../helpers");

var userController = require("../user");
var legacyMigration = require("../legacyMigration");

function getUserFromParse(whereClause) {
    logger.debug("whereClause: %s", JSON.stringify(whereClause));
    return models.user.findOne(whereClause);
}

function getSessionFromParse(whereClause) {
    logger.debug("whereClause: %s", JSON.stringify(whereClause));
    return models.session.findOne(whereClause);
}

function userMigration(whereClause) {
    // whereClause is a json that indicates how to find user
    // e.g. { _id: 123 }

    // returns payload of new entry in AWS, with the same format as Auth0"s
    // e.g.
    // {
    //     id: 12,
    //     email: "test@test.org"
    // }

    logger.debug("getting user data from Parse's DB");

    return getUserFromParse(whereClause).then(function(result) {
        if (!result) {
            logger.info("Parse user not found");
            return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
        }
        else {
            logger.info("Parse user %s found", result._id);
        }

        if (result.facebookId) {
            // facebookId exists, replace username with facebook id
            result.username = util.format("facebook|%s", result.facebookId);
            result.password = null;
            result.isSocial = true;
        }
        else {
            result.isSocial = false;
        }

        var user = {
            objectId: result._id,
            username: result.username,
            password: result._hashed_password,
            email: result.email,
            phone: result.phoneNumber,
            firstName: result.name,
            createdAt: result._created_at, // NOTE: created at is not saved at this moment - need to update API
            updatedAt: result._updated_at,
            isSocial: result.isSocial,
            isLegacyUser: true
        }

        var userObjectId = user.objectId;

        logger.info("creating user with email: %s", user.email);

        return promise.all([
            userController.createUserWithUserInfo(user, true), // set isPasswordHashed to true
            promise.resolve(userObjectId)
        ]).spread(function(result, userObjectId) {
            logger.info("user %s created", result.id);
            result = {
                id: result.id,
                email: result.email
            }

            // do migration for all data
            legacyMigration(result.id, userObjectId);
            return result;
        })
    })
}

module.exports = {
    getUserFromParse: getUserFromParse,
    getSessionFromParse: getSessionFromParse,
    userMigration: userMigration
}
