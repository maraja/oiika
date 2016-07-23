'use strict';

module.exports = {
	sendError: sendError
}

function sendError(type, message, res) {
    // type and message must be string
    var err = new Error();
    err.nonce = true; // error that is not handled
    err.name = type;
    err.message = message;
    return res.send(JSON.stringify({
		"Error": err
	}))
}
