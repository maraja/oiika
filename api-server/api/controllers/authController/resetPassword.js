var promise = require("bluebird");
var request = require('request-promise');
var u = require('underscore');
var util = require('util');

var logger = require('../../../logger');
var models = require('../../../models');
var helper = require('../../helpers');

var controllers = require('./controllers');

var config = require('./config');

module.exports = {
    resetPasswordRequestHandler: resetPasswordRequestHandler,
    resetPasswordSuccessHandler: resetPasswordSuccessHandler
};

function resetPasswordSuccessHandler(req, res) {
    function validation(payload) {
        function isValidPassword(rawPassword) {
            // NOTE: password validation code here in the future
            return true;
        }
        var result = true;
        var message = undefined;

        if (payload.resetPasswordApiKey !== config.globalConfig.secrets.authOptions.resetPasswordApiKey) {
            result = false;
            message = "invalid apikey. data of current session recorded"; // not actually recorded for now, just scares the hacker hopefully
        }
        if (!isValidPassword(payload.password)) {
            result = false;
            message = "invalid password. try a different one";
        }
        return promise.resolve({
            result: result,
            message: message
        })
    }
    function getUserByEmail(email) {
        logger.debug("getting user with email %s", email);
        return models.user.findOne({
            attributes: [
                ["id", "id"]
            ],
            where: {
                email: email
            }
        }).then(function(result) {
            if (result) {
                logger.debug("user with email %s found", email);
                result = result.dataValues;
            }
            else {
                logger.debug("no user found with email %s", email);
            }
            return result;
        })
    }
    function revokeActiveTokens(userId) {
        // revokes all active refresh tokens belongs to that user
        return models.token_store.update(
            { is_valid: false },
            { where: {
                id_user: userId,
                is_valid: true,
                type: "auth_refresh_token" }
            }
        ).then(function(result) {
            result = result[0];
            logger.debug("# of refresh tokens revoked: %s", result);
            return;
        })
    }
    function updatePassword(payload) {
        function getHashedPassword(rawPassword) {
            // returns a promise
            return controllers.passwordHandler.hash(rawPassword);
        }
        return getHashedPassword(payload.password).then(function(hashedPassword) {
            var whereClause = { where: { id: userId } };
            var payload = { password: hashedPassword };
            return models.user.update(payload, whereClause);
        }).then(function() {
            res.json({ "message": util.format("password for user %s updated", userId) });
        })
    }

    var payload = req.swagger.params.payload.value;
    var email = payload.email;
    var userId = undefined;

    return validation(payload).then(function(result) {
        if (!result.result) {
            return promise.reject(helper.makeError("INVALID_INPUT", util.format("validation failed: %s", result.message)));
        }
        else {
            return getUserByEmail(email);
        }
    }).then(function(userObject) {
        if ((!userObject) || (typeof(userObject.id) !== "number")) {
            message = util.format("no user with email %s when resetting password", email);
            logger.verbose("password update failed - %s", message);
            return promise.reject(helper.makeError("INVALID_INPUT", message));
        }
        else {
            userId = userObject.id;
            logger.verbose("password reset: userId for email %s found: %s", email, userId);
            userId = userObject.id; // update global variable
            logger.debug("password reset:", "updating password for user", userId);
            return updatePassword(payload);
        }
    }).then(function() {
        logger.verbose("password reset:", "revoking active refresh tokens for user", userId);
        return revokeActiveTokens(userId);
    }).then(function() {
        logger.verbose("password reset:", "refresh tokens revoked for user", userId);
        return; // promise ends
    }).catch(function(error) {
        console.log(error)
        if (!error.nonce) {
            logger.warn("unexpected error when updating password for user with email %s", email);
            logger.warn(error.stack);
            error = helper.makeError("TRANSACTION_ERROR", "internal service error");
        }
        helper.sendErrorResponse(res, error);
    })
}

function resetPasswordRequestHandler(req, res) {
    function validation(payload) {
        var result = true;
        var message = "";

        if (typeof(payload.email) !== "string" || (!payload.email)) {
            result = false;
            message = "email must be a non-empty string";
        }

        return promise.resolve({
            result: result,
            message: message
        });
    }
    function sendResetRequest(email) {
        var options = config.utilityOptions.resetPassword;
        options.form.email = email; // update email in request

        return request(options);
    }

    var payload = req.swagger.params.payload.value;
    var email = payload.email; // global variable for logger

    return validation(payload).then(function(result) {
        if (!result.result) {
            return promise.reject(helper.makeError("INVALID_INPUT", util.format("validation failed: %s", result.message)));
        }
        else {
            return sendResetRequest(email).catch(function(error) {
                logger.verbose("error in response from auth0 when resetting password for user %s", email);
                logger.verbose(error.name);
                return promise.reject(helper.makeError("TRANSACTION_ERROR", util.format("cannot reset password: %s", error.message)));
            });
        }
    }).then(function() {
        logger.verbose("password reset request for user with email %s sent", email);
        res.json({ "message": "password reset email sent" });
    }).catch(function(error) {
        if (!error.nonce) {
            logger.info("error when sending password reset request for user with email %s", email);
            logger.info(error.stack);
            error = promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
        }
        return promise.reject(error);

    }).catch(function(error) {
        helper.sendErrorResponse(res, error);
    })
}
