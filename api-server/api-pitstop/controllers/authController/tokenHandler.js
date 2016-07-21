var promise = require("bluebird");
var request = require("request-promise");
var u = require("underscore");
var util = require("util")

var logger = require("../../../logger");
var helper = require("../../helpers");

var models = require('../../../models');

var config = require('./config');

var userController = require("./user");
var jwtController = require("./jwt");

function createRecord(token, issuer, payload, userId) {
    return models.token_store.create({
        token: token,
        payload: payload,
        type: "auth_refresh_token",
        issuer: issuer, // for now, either "getpitstop" or "auth0"
        is_valid: true, // valid by default
        id_user: userId
    }).then(function() {
        logger.info("token record created in DB");
    }).catch(function(error) {
        if (error.name === "SequelizeForeignKeyConstraintError") {
            logger.warn("cannot create record for token %s: user %s does not exist", token, userId);
            error = helper.makeError("TRANSACTION_ERROR", "internal service error");
        }
        else {
            logger.warn("unexpected error when creating record for token %s:", token);
            logger.warn(error.stack);
        }
        return promise.reject(error);
    })
}

function revoke(token, userId) {
    // NOTE also need code to revoke toekn issued by auth0
    return models.token_store.update({
        is_valid: false
    }, {
        where: {
            "token": token,
            type: "auth_refresh_token",
            id_user: userId
        }
    }).spread(function(rowsAffected) {
        if (rowsAffected === 0) {
            logger.info("access token not found for user %s");
        }
        else {
            logger.info("token %s revoked in DB", token);
        }
        return;
    })
}

function doRefresh(tokenInfo, payload) {
    // get access token
    var issuer = tokenInfo.issuer;
    var options;

    if (issuer.match("getpitstop")) {
        logger.verbose("renewing self signed token");
        return jwtController.makeAccessToken(payload);
    }
    else if (issuer.match("auth0")) {
        logger.verbose("renewing auth0 issued token");
        options = config.utilityOptions.refresh;
        options.form.refresh_token = tokenInfo.token;
        options.form.authPayload = payload;
        return request(options).then(function(result) {
            logger.debug("request to auth0 success");
            try {
                result = JSON.parse(result).id_token;
            }
            catch (err) {
                logger.info("error when parsing result from auth0");
                logger.info(err.stack)
                return promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
            }
            return result;
        }).catch(function(error) {
            if (!error.nonce) {
                error.message = JSON.parse(error.error).error_description
                logger.info("error when obtaining access token by refresh token: error in request to auth0");
                logger.info(error.name, error.message);
                error = helper.makeError("TRANSACTION_ERROR", "internal service error");
            }
            return promise.reject(error);
        })
    }
}

function refresh(req, res) {
    function validation(refreshToken) {
        return ((!!refreshToken)); // for now just check whether the token is empty
    }
    function getTokenInfoFromDB(refreshToken) {
        logger.verbose("getting userId from DB by refresh token");
        return models.token_store.findOne({
            attributes: [
                ["id", "id"],
                ["token", "token"],
                ["id_user", "userId"],
                ["issuer", "issuer"]
            ],
            where: {
                token: refreshToken,
                is_valid: true,
                type: "auth_refresh_token"
            }
        }).then(function(result) {
            logger.debug("valid refresh token record found");
            if (result) {
                result = result.dataValues;
            }
            return result;
        })
    }
    function getPayloadByUserId(userId) {
        return models.user.findOne({
            attributes: [ "id", "email" ],
            where: { id: userId }
        }).then(function(result) {
            if (result) {
                result = result.dataValues;
            }
            else {
                var message = util.format("getting access token by refresh token: user not found for userId %s", userId);
                logger.info(message);
                result = promise.reject("TRANSACTION_ERROR", message);
            }
            return result;
        }).then(function(result) {
            return {
                authPayload: {
                    id: result.id,
                    email: result.email
                }
            }
        })
    }

    // generate access token with given refresh token, send error response if refresh token is invalid
    var refreshToken = req.swagger.params.payload.value.refreshToken;
    var tokenInfo, payload = undefined;

    if (!validation(refreshToken)) {
        logger.verbose("invalid refresh token: %s", refreshToken);
        throw (helper.makeError("INVALID_INPUT", "invalid refresh token"));
    }
    else {
        return getTokenInfoFromDB(refreshToken).then(function(result) {
            tokenInfo = result;
            if (!result) {
                logger.verbose("no token info found");
                return promise.reject(helper.makeError("INVALID_INPUT", "invalid refresh token"));
            }
            else {
                return getPayloadByUserId(tokenInfo.userId);
            }
        }).then(function(result) {
            payload = result;
            if (!payload) {
                logger.verbose("no payload found");
                return promise.reject(helper.makeError("INVALID_INPUT", "invalid refresh token"));
            }
            else {
                return doRefresh(tokenInfo, payload);
            }
        }).then(function(result) {
            logger.info("access token renewed for user %s", tokenInfo.userId);
            res.json({ accessToken: result });
        }).catch(function(error) {
            if (!error.nonce) {
                logger.warn("error in token renewal: unexpected error");
                logger.warn(error.stack);
            }
            else {
                if (error.name === "INVALID_INPUT") {
                    if (tokenInfo) {
                        // token found in DB but not valid - revoke matched token
                        // don't put it in the promsie chain
                        revoke(tokenInfo.token, tokenInfo.userId).then(function() {
                            logger.verbose("token %s revoked", tokenInfo.token);
                        })
                    }
                }
            }
            helper.sendErrorResponse(res, error);
        })
    }
}

module.exports = {
    createRecord: createRecord,
    revoke: revoke,
    refresh: refresh,
    doRefresh: doRefresh
}
