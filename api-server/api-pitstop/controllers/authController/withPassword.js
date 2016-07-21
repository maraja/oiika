var promise = require("bluebird");
var request = require('request-promise');
var u = require('underscore');

var logger = require('../../../logger');
var models = require('../../../models');
var helper = require('../../helpers');

var userController = require('../user');
var userInstallController = require('../userInstallation');
var config = require('./config');
var legacyUserController = require('./withLegacyUser');
var tokenHandler = require('./tokenHandler');

var getUserById = userController.getUserByIdMain;
var createUserWithUserInfo = userController.createUserWithUserInfo;
var loginWithLegacyCredentials = legacyUserController.loginWithLegacyCredentials;

module.exports = loginWithPassword;

function loginWithPassword(req, res) {
    var credentials = req.swagger.params.credentials.value;
    var username = credentials.username;
    var installationId = credentials.installationId || null;
    var password = credentials.password;
    var authData = {};
    var result = {};
    var userId = undefined;
    var payload = undefined;
    var tokenIssuer = undefined;
    var isLegacyUser = false; // false by default

    var doValidation = function() {
        // username is string
        // password is string
        // username is not empty
        // password is not empty
        return (typeof(username) === "string" && typeof(password) === "string" && username && password);
    }
    var getPayloadByUsername = function(username) {
        logger.debug("retrieving auth payload from DB");
        return models.user.findOne({
            attributes: [
                ["id", "id"],
                ["email", "email"]
            ],
            where: {
                "username": username
            }
        }).then(function(result) {
            if (result) {
                return {
                    id: result.id,
                    email: result.email
                }
            }
            return result; // result will either be null or the actual payload
        })
    }
    var doAuth = function(authPayload) {
        var body = config.withPassword.body;
        body.username = username;
        body.password = password;
        body.authPayload = authPayload;

        var options = {
            url: config.withPassword.authUrl,
            method: 'POST',
            form: body
        }

        logger.debug("sending login request for user %s", username);
        return request(options);
    }

    if (!doValidation()) {
        message = "invalid credentials";
        throw(helper.makeError("INVALID_INPUT", message));
    } else {
        return getPayloadByUsername(username).then(function(authPayload) {
            payload = authPayload;
            return doAuth(authPayload);
        }).then(function(result) {
            try {
                result = JSON.parse(result);
            }
            catch (err) {
                logger.warn("error in /login:", "cannot parse result from auth0");
                logger.warn("response:", result)
                return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
            }

            // get userId
            authData = result;

            var options = {
                url: config.withPassword.userInfoUrl,
                metod: 'GET',
                headers: {
                    "Authorization": "Bearer" + " " + authData.access_token
                }
            }
            return request(options);
        }).then(function(userInfo) {
            tokenIssuer = "auth0";
            logger.debug("getting user info for user %s", username);
            try {
                userId = JSON.parse(userInfo).identities[0].user_id;
            }
            catch (err) {
                logger.warn("error in /login:", "cannot get userId from auth0");
                logger.warn("response:", userInfo)
                return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
            }

            if (typeof(userId) === "number") {
                return getUserById(userId);
            }
            else {
                logger.warn("error in /login:", "userId is not number");
                logger.warn("response:", userInfo);
                return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
            }
        }).catch(function(error) {
            var statusCode = error.statusCode;
            var message = error.message;
            if (error.name === "StatusCodeError") {
                if (statusCode === 401) {
                    message = "invalid username or password";
                    error.message = message;
                    // authrozation failed - invalid credentials
                }
                else if (statusCode === 429) {
                    message = "too many fail attempts. Instruction for unlocking account is sent by email";
                    error.message = message;

                }
                else {
                    // http request error
                    // NOTE: error name can be other than TRANSACTION_ERROR
                    logger.warn("unsupported statusCode %s", statusCode);
                    logger.warn(error.message);
                    message = "internal service error";
                }

                error = helper.makeError("TRANSACTION_ERROR", message);
            }
            else {
                // unexpected error
                // NOTE: error name can be other than TRANSACTION_ERROR
                // error = helper.makeError("TRANSACTION_ERROR", message);
                // message = "internal service error";
            }
            return promise.reject(error);
        }).catch(function(error) {
            if (error.statusCode === 429) {
                return promise.reject(error);
            }
            else {
                if (!((config.globalConfig.environment !== "test" || config.legacyUserOptions.checkLegacyUserInTestEnv))) {
                    logger.info("user %s not found in user data DB", credentials.username);
                }
                else {
                    logger.info("user %s not found in user data DB, attempting to get user from Parse; error message: %s", username, error.message);
                    isLegacyUser = true;
                    return loginWithLegacyCredentials(credentials, "password").then(function(result) {
                        tokenIssuer = "getpitstop";
                        // result is self signed tokens
                        logger.info("legacy user %s login successful", username);
                        authData.id_token = result.accessToken;
                        authData.refresh_token = result.refreshToken;

                        return result.payload;
                    }).then(function(result) {
                        payload = result;
                        return getUserById(payload.id);
                    })
                }
            }
        }).then(function(userInfo) {
            if (isLegacyUser) {
                userInfo.migration = {
                    // isMigrationDone should always be false when migration starts
                    "isMigrationDone": false,
                    "migrationState": null
                }
            }
            result = {
                accessToken: authData.id_token,
                refreshToken: authData.refresh_token,
                user: userInfo
            }
            logger.info("saving session info in DB");
            return tokenHandler.createRecord(result.refreshToken, tokenIssuer, payload, payload.id);
        }).then(function() {
            logger.info("login successful for user %s", credentials.username);
            res.json(result);
            return result
        }).catch(function(error) {
            if (!error.nonce) {
                // make sure error is processable
                logger.warn("unexpected error: %s", error.name);
                logger.warn(error.stack);
                error = helper.makeError("TRANSACTION_ERROR", message);
            }
            logger.info("login attempt failed for user %s:", username, error.message);
            return promise.reject(error);
        }).then(function(result) {
            if (installationId !== null) {
                userInstallController.createUserInstallation(result.user.id, installationId).catch(function(error) {
                    logger.warn("unexpected error when creating installtaion record for user %s with installtaion id %s", result.user.id, installationId);
                    logger.warn(error.stack);
                });
            }
        }).catch(function(error) {
            helper.sendErrorResponse(res, error);
        })
    }
}
