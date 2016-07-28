'use strict';

module.exports = {
	sendError: sendError,
	makeError: makeError
}

function makeError(type, message){
	var err = new Error();
	err.name = type;
	err.message = message;
	return err;
}

function sendError(type, message, res) {
    // type and message must be string
    var err = new Error();
    err.nonce = false; // error that is not handled
    err.name = type;
    err.message = message;
    return res.send(JSON.stringify({
		"Error": err
	}))
}
