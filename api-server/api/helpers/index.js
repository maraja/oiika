'use strict';

var logger = require('../../logger');
var errors = require('./errors');
var errorHandler = require('../../handlers').errorHandler;
var passwordHandler = require('./password');
var helper = require('../../helpers');

var APIServerRuntimeError = errors

module.exports = {
    finalize: finalizeResponse,
    APIServerRuntimeError: APIServerRuntimeError,
    sendErrorResponse: sendErrorResponse,
    makeError: helper.makeError,
    passwordHander: passwordHandler

}

var getToken = function(oldToken) {
    // TODO: function for token renewal
    var newToken = oldToken;

    return newToken
}

var setHeader = function(response, status) {
    // sets status code and header
    response.status(status);
    response.set({
        "Content-Type": "application/json",
        "charset": "UTF-8"
    })

    return;
}

var getBody = function(response, content, message, token) {

    var body = {
        "metadata": {},
        "data": {}
    };

    body.metadata = {
        "token": getToken(token)
    }

    if (content) {
        body.data = content;
    }
    else {
        // body is json of error message
        body.data = {
            "message": message
        }
    }

    return body
}

function finalizeResponse(response, status, content, message, token) {
    // set default values - not available by default in nodejs v4 or v5
    if (!status) {
        status = 200
    }

    if (typeof(status) != "number") {
        logger.error("invalid status code");
        throw("invalid status code");
    }
    if (status == 200 && message) {
        logger.warn("got error message but status code is 200");
        throw("got error message but status code is 200");
    }

    if (!content && !message) {
        logger.warn("neither body or error message was provided");
        throw("neither body or error message was provided");
    }

    var body = getBody(response, content, message, token);
    setHeader(response, status, message);

    // logger.debug("sending response", body)

    response.send(body);

}

function sendErrorResponse(res, err) {
    return errorHandler(err, null, res, null);
}
