var jwt = require('express-jwt');

// var config = require('config').get('globalConfig');
// var logger = require('../logger');
// var helper = require('../helpers');
var config = require('../config');

// var getSecret = function(req, payload, done) {
//     var err, result = null;

//     if (!payload) {
//         err = helper.makeError("INVALID_INPUT", "invalid access token");
//     }
//     else {
//         switch (payload.iss) {
//             case "https://getpitstop.auth0.com/":
//                 result = new Buffer(config.secrets.jwt.auth0.key, 'base64');
//                 break;
//             case "getpitstop":
//                 result = new Buffer(config.secrets.jwt.selfSigned.key, 'base64');
//                 break;
//             default:
//                 err = helper.makeError("INVALID_INPUT", "invalid token issuer");
//                 break;
//         }
//     }
//     return done(err, result);
// }

var authHandler = jwt({
    secret: config.secrets.jwt.selfSigned.key,
    getToken: function fromHeaderOrQueryString(req) {
        console.log("token...");
        var token = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.query && req.query.token) {
            token = req.query.token;
        }
        return token;
    }
})

function errorHandler(err, req, res, next) {
    var body = {};
    var status = err.status || 400; // default error code is 400

    // if (err.nonce) {
    //     logger.debug(err.message);
    // }

    // for testing
    if (err.message === "invalid refresh token") {
        body.userMessage = "Session expired, please log in."
    }

    if (err.code) {
        // error in swaggerExpress scope
        if (err.code == "INVALID_TYPE" ||
            err.code == "SCHEMA_VALIDATION_FAILED" ||
            err.code == "REQUIRED") {
            var paramName = err.paramName;
            var message = err.message;

            if (typeof(err.results) === "object" && typeof(err.results.errors) === "object") {
                message = err.results.errors[0].message;
                paramName = err.results.errors[0].path;
            }

            body = {
                "error": "Invalid parameter: " + paramName,
                "message": message
            }
        }
        else {
            body = err;
        }
        res.status(status);
    }

    // error in controller
    else if (err.name && err.name === "INVALID_INPUT") {
        body = {
            "error": "Invalid input",
            "message": err.message
        }
        res.status(status);

    }
    else if (err.name && err.name === "TRANSACTION_ERROR") {
        body = {
            "error": "Request failed",
            "message": err.message
        }
        res.status(status);
    }
    else {
        body = {
            "error": err.name,
            "message": "internal service error"
        }

        if (err.message != "Invalid content type (plain/text).  These are valid: application/json") {
            // logger.error(err.stack);
            body = {
                "error": "Invalid input",
                "message": err.message
            }
        }
        res.status(status);


        // if (typeof(next) === "function") {
        //     next(err);
        // }
    }

    // for testing
    if (err.message == "invalid refresh token") {
        body.userMessage = "Session expired, please log in."
    }
    res.json(body);
}

module.exports = {
    authHandler: authHandler,
    errorHandler: errorHandler
}
