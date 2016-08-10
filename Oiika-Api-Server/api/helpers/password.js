// Tools for encrypting and decrypting passwords.
// Basically promise-friendly wrappers for bcrypt.
var Promise = require('bluebird');
var bcrypt = require('bcrypt-nodejs');
const error = require('../helpers/errors');


// assignPassword is a callback that takes the hashed password along with
// a promise resolve to call at the end of the assigning.
function createAndAssignPassword(password, saltRounds, assignPassword){

	return new Promise(function(resolve, reject){

		var createSalt = function(){
			return new Promise(function(accept, decline){
				bcrypt.genSalt(saltRounds, function(err, result){
					if(err) {
						decline(err)
					} else {
						accept(result);
					}
				})
			});
		};

		var hashPassword = function(salt){
			return new Promise(function(accept, decline){
				bcrypt.hash(password, salt, null, function(err, result){
					if(err) {
						decline(err)
					} else {
						accept(result);
					}
				})
			});
		};

		// promise chain
		createSalt()
		.then(hashPassword)
		.then(function(hash){
			assignPassword(hash, resolve);
		}).catch(function(err){
			reject(err);
		});

	});
}

/*
	bcrypt.hash(data, salt, progress, callback)
	data - [REQUIRED] - the data to be encrypted.
	salt - [REQUIRED] - the salt to be used to hash the password. if specified as a number then a salt will be generated and used (see examples).
	progress - a callback to be called during the hash calculation to signify progress
	callback - [REQUIRED] - a callback to be fired once the data has been encrypted. uses eio making it asynchronous.
		error - First parameter to the callback detailing any errors.
		encrypted - Second parameter to the callback providing the encrypted form.
*/
// Returns a promise for a hashed password string.
function hash(password) {
	return new Promise(function(resolve, reject) {
		bcrypt.hash(password, null, null, function(err, hashedPassword) {
			if (err) {
				reject(err);
			} else {
				resolve(hashedPassword);
			}
		});
	});
}

// Returns a promise for whether this password compares to equal this
// hashed password.
function compare(password, hashedPassword) {
	return new Promise(function(resolve, reject) {
		bcrypt.compare(password, hashedPassword, function(err, success) {
			if (err) {
				error.makeError("INVALID_PASSWORD", err)
				.then(function(error){
					reject(error);
				});
			} else {
				resolve(success);
			}
		});
	});
}

module.exports = {
	hash: hash,
	compare: compare,
	createAndAssignPassword: createAndAssignPassword
};
