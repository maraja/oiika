// Tools for encrypting and decrypting passwords.
// Basically promise-friendly wrappers for bcrypt.
var Promise = require('bluebird');
var bcrypt = require('bcrypt-nodejs');
const error = require('../helpers/errors');

const saltRounds = 10;


// assignPassword is a callback that takes the hashed password along with
// a promise resolve to call at the end of the assigning.
function createAndAssignPassword(password, assignPassword){

	return new Promise(function(resolve, reject){

		var createSalt = function(){
			return new Promise((accept, decline) => {
				bcrypt.genSalt(saltRounds, (err, result) => {
					if(err) {
						return decline(err);
					} else {
						return accept(result);
					}
				})
			});
		};

		var hashPassword = salt => {
			return new Promise((accept, decline) => {
				bcrypt.hash(password, salt, null, (err, result) => {
					if(err) {
						return decline(err);
					} else {
						return accept(result);
					}
				})
			});
		};

		// promise chain
		return createSalt()
		.then(hashPassword)
		.then(hash => {
			return assignPassword(hash, resolve);
		}).catch(err => {
			return reject(err);
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
				return reject(err);
			} else {
				return resolve(hashedPassword);
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
				return error.errorHandler(null, "INVALID_PASSWORD", err, reject, null);
			} else {
				return resolve(success);
			}
		});
	});
}

module.exports = {
	hash: hash,
	compare: compare,
	createAndAssignPassword: createAndAssignPassword
};
