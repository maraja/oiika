'use strict';

var promise = require("bluebird");
var jwt = require('jsonwebtoken');

var logger = require('../logger');
var encrypt = require('./password')
var models = require('../models');

var config = require('../config');
var secret = require('../secrets').environment[config.environment];

var sequelize = models.sequelize;

console.log(secret)

var secretKey = secret["token_secret_key"];

module.exports = {
    validate: jwtHandler
};

function jwtHandler(req, name, key, callback) {
    console.log(req.headers.authorization);
    console.log(name);
    console.log(key);

    var token = "";
    var authorizationString = req.headers.authorization;

    if (!authorizationString) {
        callback(new Error("no token provided"));
        return;
    }
    else {
        authorizationString = authorizationString.split(" ")
    }

    if (authorizationString.length !== 2 || authorizationString[0].toLowerCase() !== "bearer" || !authorizationString[1]) {
        callback(new Error("invalid header"));
        return;
    }
    else {
        token = authorizationString[1];   // in format of "Bearer [token]"
    }

    var data = jwt.verify(token, secretKey)
    console.log(data)

    callback(new Error("aborted"));










    // console.log(callback);
    // var params = req.swagger.params;
    // var credentials = params.credentials.value;
    // var username = credentials.username;
    // var password = credentials.password;
    // var hashedPassword = null;
    // var userId = null;
    // var message = '';
    // var errorLogged = false;
    // var isLoggedIn = false;
    //
    // var makeAccessToken = function(profile) {
    //     return jwt.sign(profile, private_key, {expiresIn: config.accessTokenExpiresIn});
    // }
    //
    // var makeRefreshToken = function(profile) {
    //     return jwt.sign(profile, private_key, {expiresIn: config.refreshTokenExpiresIn})
    // }
    //
    // if (!credentials.username || !credentials.password) {
    //     message = "either username or password is not provided"
    //     logger.info(message);
    //     res.json(message);
    //     return;
    // }
    // else {
    //     models.user.findOne({
    //         attributes: [
    //             ["id", "id"],
    //             ["username", "username"],
    //             ["password", "hashedPassword"]
    //         ],
    //         where: {
    //             username: username
    //         }
    //     }).then(function(result) {
    //         if (result) {
    //             result = result.dataValues;
    //             userId = result.id;
    //             hashedPassword = result.hashedPassword;
    //             return encrypt.compare(password, hashedPassword)
    //         }
    //         else {
    //             message = "login failed: user not found";
    //             logger.info("login attempt failed for user %s: user not found", username);
    //             var err = new Error(message);
    //             err.nonce = true;
    //             res.json(message);
    //             throw err;
    //         }
    //     }, function(error) {
    //         if (!error.nonce) {
    //             message = "internal db service error";
    //             logger.warn("login attempt failed for user %s: internal db service error", username)
    //             logger.warn(error.name, error.message);
    //             var err = new Error(message);
    //             err.nonce = true;
    //             res.json(message);
    //             throw err;
    //         }
    //
    //     }).then(function(isMatch) {
    //         if (isMatch) {
    //             logger.info("successful login for user %s", username);
    //             var profile = {
    //                 id: userId,
    //                 username: username
    //             }
    //             var accessToken = makeAccessToken(profile);
    //             var refreshToken = makeRefreshToken(profile);
    //
    //             var response = {
    //                 accessToken: accessToken,
    //                 refreshToken: refreshToken
    //             }
    //
    //
    //             res.json(response);
    //         }
    //         else {
    //             message = "login attempt failed - invalid password";
    //             logger.info("login attempt failed for user %s: invalid password", username);
    //             var err = new Error(message);
    //             err.nonce = true;
    //             res.json(message);
    //             throw err;
    //         }
    //     }, function(error) {
    //         if (!error.nonce) {
    //             message = "login attempt failed: failed to hash password";
    //             logger.warn("login attempt failed for user %s: failed to hash password", error);
    //             var err = new Error(message);
    //             err.nonce = true;
    //             res.json(message);
    //             throw err;
    //         }
    //
    //     }).then(null, function(error) {
    //         if (!error.nonce) {
    //             logger.warn("unexpected error", error)
    //             res.json(message);
    //         }
    //     })
    // }
}
