var promise = require("bluebird");
var request = require('request-promise');
var u = require('underscore');

var controller = require('../userInstallation');
var logger = require('../../../logger');
var helper = require('../../helpers');

var config = require('./config');

var userController = require("./user");
var jwtController = require("./jwt");

module.exports = {
    loginWithLegacyCredentials: loginWithLegacyCredentials
}

function loginWithLegacyCredentials(credentials, type) {
    var installationId = credentials.installationId;
    var username = credentials.username;
    // credentials: either username password pair or social access token
    // for social access tokens, only facebook token is supported
    // type: "password" or "social"
    var getWhereClause = function(credentials, type) {
        var whereClause = undefined;

        if (type === "password") {
            whereClause = {
                "username": username
            }
        }
        else if (type === "social") {
            // NOTE: for now only facebook login is supported, assuming credentials are only for facebook
            // for simplicity.
            whereClause = {
                "_auth_data_facebook.id": credentials.facebookId
            }
        }
        else {
            logger.warn("unsupported legacy login type: %s", type);
            return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
        }

        return whereClause;
    }
    var isValidPayload = function(whereClause) {
        // returns a promise
        return userController.getUserFromParse(whereClause).then(function(result) {
            var hashedPassword = undefined;
            if (result === null) {
                return false;
            }
            if (type == "password") {
                hashedPassword = result._hashed_password;
                // if type is password, need to verify whether hashed password matches the given one
                return helper.passwordHander.compare(credentials.password, hashedPassword);
            }
            else {
                // otherwise getUser will return the user matched by given values
                // true if result is not null
                result = (!!result);
            }
            return (promise.resolve(result));
        })
    }

    var whereClause = getWhereClause(credentials, type);

    return isValidPayload(whereClause).then(function(isValid) {
        if (isValid) {
            logger.info("legacy user record found, migrating credentials to AWS");
            // create user in new DB
            return userController.userMigration(whereClause);
        }
        else {
            logger.info("legacy user's payload is invalid, treating as new user");
            var error = helper.makeError("TRANSACTION_ERROR", "invalid username or password");
            return promise.reject(error);
        }
    }).then(function(payload) {
        logger.info("user created in AWS, payload: %s", JSON.stringify(payload));
        var accessToken = jwtController.makeAccessToken(payload);
        var refreshToken = jwtController.makeRefreshToken(payload);
        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
            payload: payload
        }
    })
}
