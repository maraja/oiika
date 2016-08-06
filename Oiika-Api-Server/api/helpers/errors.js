'use strict';
const _ = require('underscore');
const Promise = require('bluebird');

module.exports = {
	sendError: sendError,
	makeError: makeError,
	makeMongooseError: makeMongooseError
}

function makeError(type, message){
	return new Promise(function(resolve, reject){
		var err = new Error();
		err.name = type;
		err.message = message;
		resolve(err);
	});
}

function makeMongooseError(err){
	console.log(err)
	return new Promise(function(resolve, reject){
		var errors = [];

		var error = new Error();
		error.name = err.name;

		var promises = [];

		if(err.errors){
			_.each(err.errors, function(element, content){

				promises.push(new Promise(function(resolve, reject) {

					errors.push({content: err.errors[content].name, "Error": err.errors[content].message});

					resolve();

				})

			)});
		} else {
			errors.push(err.message);
		}


		Promise.all(promises)
		.then(function(){
			error.message = errors;
			resolve(error);
		});
	});
}

function sendError(type, message, res) {
    // type and message must be string
    var err = new Error();
    err.nonce = false; // error that is not handled
    err.name = type;
    err.message = message;
    return res.send(JSON.stringify({
		"Error": err
	}));
}
