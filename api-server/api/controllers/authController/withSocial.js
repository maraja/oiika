var promise = require("bluebird");
var request = require('request-promise');
var u = require('underscore');

var logger = require('../../../logger');
var models = require('../../../models');
var helper = require('../../helpers');

var userController = require('../user');
var userInstallController = require('../userInstallation');
var tokenHandler = require('./tokenHandler');
var legacyUserController = require('./withLegacyUser');

var config = require('./config');

var getUserById = userController.getUserByIdMain;
var createUserWithUserInfo = userController.createUserWithUserInfo;
var loginWithLegacyCredentials = legacyUserController.loginWithLegacyCredentials;

var tokenHandler = require('./tokenHandler');

module.exports = {
    loginWithSocialAccessToken: loginWithSocialAccessToken,
    // getIdOrCreateUserThenGet: getIdOrCreateUserThenGet
};

function verifyToken(provider, accessToken) {
    // returns

    // provider support is verified in caller

    logger.debug("verifying access token");

    var body = config.withSocial.body;

    body.connection = provider;
    body.access_token = accessToken;

    var options = {
        url: config.withSocial.authUrl,
        method: 'POST',
        form: body
    }

    logger.debug("sending auth login request");
    return request(options).then(function(result) {
        logger.debug("access token verified");
        return result;

    }, function(error) {
        logger.info("social auth login failed:", error.message);

        if (!error.statusCode && error.stack) {
            logger.info(error.stack);
        }

        if (error.statusCode === 401) {
            error = helper.makeError("TRANSACTION_ERROR", "invalid token - login failed");
        }
        else {
            error = helper.makeError("TRANSACTION_ERROR", "internal service error");
        }

        return promise.reject(error);
    }).then(function(result) {
        logger.debug("parsing result from auth0")
        try {
            result = JSON.parse(result);
        }
        catch (err) {
            logger.warn("error in /login:", "cannot parse result from auth0");
            logger.warn("response:", result)
            return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
        }

        return result;
    })
}

function getUserInfoBySocialAuth(token) {
    logger.debug("getting user info");

    var options = {
        url: config.withPassword.userInfoUrl,
        metod: 'GET',
        headers: {
            "Authorization": "Bearer" + " " + token
        }
    }

    return request(options).then(function(result) {
        try {
            result = JSON.parse(result);
        }
        catch (err) {
            logger.warn("error in /login:", "cannot parse result from auth0");
            logger.warn("response:", result)
            return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
        }

        return result;
    }).then(function(userInfo) {
        logger.debug("reformatting userInfo");
        var result = {};
        try {
            result.username = userInfo.user_id;
            result.firstName = userInfo.given_name;
            result.lastName = userInfo.family_name;
            result.email = userInfo.email;
            result.isSocial = true;
        }
        catch (err) {
            logger.warn("error in /login:", "cannot parse result from auth0");
            logger.warn("response:", result)
            return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
        }

        return result;
    })
}

function getPayloadByUsername(username) {
    logger.debug("getting payload by username");
    return models.user.findOne({
        attributes: [
            ["id", "id"],
            ["email", "email"]
        ],
        where: {
            username: username
        }
    }).then(function(result) {
        if (result) {
            result = result.dataValues
        };
        return result;
    })
}

function migrateSocialUserFromParse(userInfo) {
    function getFacebookId(rawId) {
        return rawId.replace("facebook|", ""); // for now only facebook is supported
    }
    return loginWithLegacyCredentials({
        facebookId: getFacebookId(userInfo.username)
    }, "social").then(function(result) {
        return result.payload.id;
    })
}

function loginWithSocialAccessToken(req, res) {
    function getIdOrCreateUserThenGet(userInfo) {
        logger.debug("getting info of user %s", userInfo.username);
        return models.user.findOne({
            attributes: [
                ["id", "id"]
            ],
            where: {
                username: userInfo.username
            }
        }).then(function(result) {
            if (result) {
                logger.verbose("user found in DB");
                return result.dataValues.id;
            }
            else {
                logger.verbose("user not found in DB, attempting to migrate from Parse");
                return migrateSocialUserFromParse(userInfo).then(function(result) {
                    isLegacyUser = true;
                    return result;
                }).catch(function(error) {
                    logger.info("legacy user migration failed - treating social user as new user");
                    return createUserWithUserInfo(userInfo).then(function(result) {
                        return result.id;
                    })
                });
            }
        })
    }

    var credentials = req.swagger.params.credentials.value;
    var accessToken = credentials.accessToken;
    var installationId= credentials.installationId || null;
    var provider = credentials.provider;
    var authData, userInfo, tokenIssuer, authPayload, message = undefined; // global variables
    var isLegacyUser = false; // false by default
    var result = {};

    var doValidation = function() {
        var result = true;
        if (!(typeof(accessToken) === "string") && accessToken) {
            message = "accessToken must be a non-empty string";
            result = false;
        }
        if (!(provider === "facebook")) {
            message = "unsupported social auth provider: " + provider;
            result = false;
        }
        return result;
    }

    logger.verbose("social auth login attempt begin");

    if (!doValidation()) {
        logger.debug("login failed:", message);
        throw (helper.makeError("INVALID_INPUT", message));
    }
    else {
        return verifyToken(provider, accessToken).then(function(result) {
            authData = result;
            return getUserInfoBySocialAuth(result.access_token);
        }).catch(function(error) {
            logger.info("social login failed; error message: %s", error.message);
            return promise.reject(helper.makeError("INVALID_INPUT", "invalid social access token"));
        }).then(function(result) {
            return getIdOrCreateUserThenGet(result);
        }).then(function(userId) {
            return getUserById(userId);
        }).then(function(result) {
            userInfo = result; // global variable update
            if (isLegacyUser) {
                userInfo.migration = {
                    // isMigrationDone should always be false when migration starts
                    "isMigrationDone": false,
                    "migrationState": null
                }
            }
            return getPayloadByUsername(userInfo.username);
        }).then(function(payload) {
            authPayload = payload; // global variable update
            tokenIssuer = "auth0"; // will always be auth0 for social login
            return {
                userInfo: userInfo,
                payload: authPayload
            }
        }).then(function(results) {
            logger.verbose("authData & userInfo reformat");
            if (results.userInfo.username) {
                delete results.userInfo.username; // remove username from result
            }

            // global variable update
            // NOTE: may have security problems
            result = {
                accessToken: authData.id_token,
                refreshToken: authData.refresh_token,
                user: results.userInfo
            };

            return;

        }).then(function() {
            // get new token with payload in it by using refresh token
            logger.verbose("getting new access token with authPayload")
            return tokenHandler.doRefresh({
                issuer: tokenIssuer,
                token: result.refreshToken
            }, authPayload);
        }).then(function(accessToken) {
            result.accessToken = accessToken;
            return;
        }).then(function() {
            logger.info("saving session info in DB");
            // NOTE: userId should be retrieved from userInfo, not authPayload
            return tokenHandler.createRecord(result.refreshToken, tokenIssuer, authPayload, authPayload.id);
        }).then(function() {
            logger.info("login successful for user %s", authPayload.id);
            res.json(result);
            return result;
        }).then(function(result) {
            if (installationId !== null) {
                userInstallController.createUserInstallation(userInfo.id, installationId).catch(function(error) {
                    logger.warn("unexpected error when creating installtaion record for user %s with installtaion id %s", result.user.id, installationId);
                    logger.warn(error.stack);
                });
            }
        }).catch(function(error) {
            helper.sendErrorResponse(res, error);
        })
    }
}
