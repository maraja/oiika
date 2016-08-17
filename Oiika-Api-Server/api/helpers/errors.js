'use strict';
const _ = require('underscore');
const Promise = require('bluebird');

module.exports = {
	errorHandler: errorHandler,
	sendError: sendError,
	makeError: makeError,
	makeMongooseError: makeMongooseError
}

// call this without a reject if you aren't running errors within promises
// call this with a reject if you're running errors within promises
// call this without a name or message if you're running a premade error through error handling
// call this without an error if you're creating a new error to return.
function errorHandler(err, name, message, reject, res){
	if(err && reject){
		switch (err.name){
			case "ValidationError":
			case "CastError":
			case "MongoError":
				return makeError(err.name, err.message)
				.then(function(error){
					return reject(error);
				});
				break;
			default:
				return makeMongooseError(err)
				.then(function(error){
					return reject(error);
				});
				break;
		}
	} else if (err && !reject) {
		switch (err.name){
			case "ValidationError":
			case "CastError":
			case "MongoError":
				return makeError(err.name, err.message)
				.then(function(err){
					return sendError(err.name, err.message, res); 
				});
				break;
			default:
				return makeMongooseError(err)
				.then(function(err){
					return sendError(err.name, err.message, res); 
				});
				break;
		}
	} else if (name && message && reject){
		return makeError(name, message)
		.then(function(error){
			return reject(error);
		});
	} else if (name && message && !reject){
		return makeError(name, message)
		.then(function(err){
			return sendError(err.name, err.message, res); 
		});
	}
}

function makeError(type, message){
	return new Promise(function(resolve, reject){
		var err = new Error();
		err.name = type;
		err.message = message;
		console.error(err);
		return resolve(err);
	});
}

function makeMongooseError(err){
	return new Promise(function(resolve, reject){
		var errors = [];

		var error = new Error();
		error.name = err.name;

		var promises = [];

		if(err.errors){
			_.each(err.errors, function(element, content){

				promises.push(new Promise(function(resolve, reject) {

					errors.push({content: err.errors[content].name, "Error": err.errors[content].message});

					return resolve();

				})

			)});
		} else {
			errors.push(err.message);
		}


		Promise.all(promises)
		.then(function(){
			error.message = errors;
			return resolve(error);
		});
	});
}

function sendError(type, message, res) {
    // type and message must be string
    var err = new Error();
    // err.nonce = false; // error that is not handled
    err.name = type;
    err.message = message;
    return res.status(400).send(JSON.stringify({
		"error": err
	}));
}
