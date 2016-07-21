var jwt = require('jsonwebtoken');
var config = require('./config');
var logger = require('../../../logger');
var hat = require('hat');
var rack = hat.rack();

function makeAccessToken(payload) {
    payload = { authPayload: payload }; // rewrite payload
    payload.aud = config.globalConfig.secrets.jwt.selfSigned.audience;
    var options = config.withlegacySession.jwtOptions;
    var selfSignJwtKey = new Buffer(config.globalConfig.secrets.jwt.selfSigned.key, "base64");
    var token = jwt.sign(payload, selfSignJwtKey, options);
    logger.debug("access token generated");
    return token;
}

function makeRefreshToken(payload) {
    var token = rack();
    logger.debug("refresh token generated");
    return token;
}

function decode(token) {
    var payload = jwt.decode(token);
    logger.debug("payload decoded: %s", JSON.stringify(payload));
    return payload;
}

function verify(token, key) {
    return jwt.verify(token, key);
}

module.exports = {
    makeAccessToken: makeAccessToken,
    makeRefreshToken: makeRefreshToken,
    decode: decode,
    verify: verify
}
