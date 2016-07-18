var promise = require("bluebird");
var request = require("request-promise");
var u = require("underscore");
var util = require("util")

var logger = require("../../../logger");
var helper = require("../../helpers");

var config = require('./config');

var userController = require("./user");
var userInstallController = require('../userInstallation');

var jwtController = require("./jwt");
var tokenHandler = require('./tokenHandler');
var getUserInfo = require("../user").getUserByIdMain;

var legacyMigration = require('../legacyMigration');

module.exports = loginWithLegacySession;

function loginWithLegacySession(req, res) {
    // TODO: error handling when request fails:
    // get matched session from parse
    // get user data from parse
    // save user into AWS

    // NOTE: need to define error code first
    // e.g. error code for duplicate value

    var isValidPayload = function(userId, sessionToken) {
        var getUserPointer = function(userId) {
            return util.format("%s$%s", "_User", userId);
        }
        var isSessionActive = function(session) {
            // NOTE: for now expiration date is not checked so users wont be screwed
            return true;
        }

        var whereClause = {
            "_p_user": getUserPointer(userId),
            "_session_token": sessionToken
        };
        return userController.getSessionFromParse(whereClause).then(function(result) {
            // NOTE: null also has type of "object"
            var result = ((typeof(result) === "object") && (result !== null) && isSessionActive(sessionToken));
            logger.debug("is user found in Parse: %s", result);
            return result;
        }).catch(function(error) {
            logger.warn("error when getting user from parse:");
            logger.warn(error.stack);
        })
    }

    var credentials = req.swagger.params.credentials.value;
    var userId = credentials.userId;
    var installationId = credentials.installationId || null;
    var whereClause = undefined;
    var sessionToken = credentials.sessionToken;

    var accessToken = undefined;
    var refreshToken = undefined;
    var userInfo = undefined;
    var result = {};
    var payload = undefined;

    logger.info("checking if payload exists in parse");
    return isValidPayload(userId, sessionToken).then(function(isValid) {
        if (isValid) {
            logger.info("legacy user record found, migrating credentials to AWS");
            // create user in new DB
            whereClause = { _id: userId };
            return userController.userMigration(whereClause);
        }
        else {
            logger.info("legacy user's payload is invalid, treating as new user");
            var error = helper.makeError("TRANSACTION_ERROR", "user not found for given payload");
            return promise.reject(error);
        }
    }).then(function(result) {
        payload = result;
        logger.info("user created in AWS, payload: %s", JSON.stringify(payload));
        accessToken = jwtController.makeAccessToken(payload);
        refreshToken = jwtController.makeRefreshToken(payload);

        // get userInfo
        return getUserInfo(payload.id);
    }).then(function(userInfo) {
        userInfo.migration = {
            // isMigrationDone should always be false when migration starts
            "isMigrationDone": false,
            "migrationState": null
        }
        result = {
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: userInfo
        };

        logger.info("saving session info in DB");
        return tokenHandler.createRecord(result.refreshToken, "getpitstop", payload, payload.id);
    }).then(function() {
        logger.info("login successful for user %s", result.user.id);
        res.json(result);
        return result;
    }).then(function(result) {
        if (installationId !== null) {
            userInstallController.createUserInstallation(result.user.id, installationId).catch(function(error) {
                logger.warn("unexpected error when creating installtaion record for user %s with installtaion id %s", result.user.id, installationId);
                logger.warn(error.stack);
            });
        }
    }).catch(function(err) {
        helper.sendErrorResponse(res, err);
    })
}
