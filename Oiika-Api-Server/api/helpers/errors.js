'use strict';

module.exports = APIServerRuntimeError;

// TODO: error is thrown but not being caught

function APIServerRuntimeError(message) {
    this.message = (message || "");
}
APIServerRuntimeError.prototype = new Error();
APIServerRuntimeError.prototype.name = "APIServerRuntimeError";

function onErrorHandler(res, message, status) {
    var body = {
        "message": message
    };
    res.status(status);
    res.json(body);
}
