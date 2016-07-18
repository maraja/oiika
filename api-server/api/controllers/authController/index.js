var withPassword = require('./withPassword');
var withSocial = require('./withSocial');
var withLegacySession = require('./withLegacySession');
var resetPassword = require('./resetPassword');
var tokenHandler = require('./tokenHandler');

module.exports = {
    passwordAuth: withPassword,
    socialAuth: withSocial.loginWithSocialAccessToken,
    legacyAuth: withLegacySession,
    // getIdOrCreateUserThenGet: withSocial.getIdOrCreateUserThenGet,
    resetPasswordRequestHandler: resetPassword.resetPasswordRequestHandler,
    resetPasswordSuccessHandler: resetPassword.resetPasswordSuccessHandler,
    getAccessTokenByRefreshToken: tokenHandler.refresh
}
