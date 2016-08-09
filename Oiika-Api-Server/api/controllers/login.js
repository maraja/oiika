const accountModel = app.models.accountModel;
const userModel = app.models.userModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');
const pass = require('../helpers/password');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	loginLocal: loginLocal,
	loginFacebook: loginFacebook,
	loginGoogle: loginGoogle
};


// LOCAL LOGIN FUNCTION
function loginLocal(req, res){
	var login = req.swagger.params.login.value;

	var fields = {
		email: 'email',
		password: 'password'
	};

	// promise to check to see if account exists.
	var checkAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.find({email: login.email}, function(err, result) {

				if(err) {
					// send reject as a callback
					error.makeMongooseError(err, reject)
					.then(function(error){
						reject(error);
					});
				}
				else if (result.length > 0){
					resolve(result[0]);
				}
				else {
					error.makeError("INVALID_ENTRY", "Account does not exist.")
					.then(function(error){
						reject(error);
					});
				}

			});
		})
	}

	// create a promise to check if password matches
	var checkPassword = function(result){
		return new Promise(function(resolve, reject) {
			pass.compare(login.password, result.password)
			.then(function(isValid){
				if(isValid){
					resolve(result);
				} else {
					error.makeError("INVALID_PASSWORD", "Password incorrect")
					.then(function(error){
						reject(error);
					});
				}
			}).catch(function(err){
				reject(err);
			})
		})
	};


	// begin promise chain looping through promise array.
	checkAccount()
	.then(checkPassword)
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Login Successful",
			"user": {
				account_id: _id,
				email: result.email,
				first_name: result.first_name,
				last_name: result.last_name,
				account_type: result.account_type,
				user_type: result.user_type
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		error.sendError(err.name, err.message, res);
	});
};


// FACEBOOK LOGIN FUNCTION
function loginFacebook(req, res){
	var login = req.swagger.params.login.value;

	var fields = {
		first_name: 'first_name',
		last_name: 'last_name',
		email: 'email',
		facebook_id: 'facebook_id',
		gender: 'gender'
	};

	// promise to check to see if account exists.
	var checkAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.find({facebook_id: login.facebook_id}, function(err, result) {

				if(err) {
					// send reject as a callback
					error.makeMongooseError(err, reject)
					.then(function(error){
						reject(error);
					});
				}
				else if (result.length > 0){
					resolve(result[0]);
				}
				else {
					error.makeError("INVALID_ENTRY", "Account does not exist.")
					.then(function(error){
						reject(error);
					});
				}

			});
		})
	}


	// begin promise chain looping through promise array.
	checkAccount()
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Login Successful",
			"user": {
				account_id: _id,
				email: result.email,
				first_name: result.first_name,
				last_name: result.last_name,
				account_type: result.account_type,
				user_type: result.user_type
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		error.sendError(err.name, err.message, res);
	});
};


// GOOGLE LOGIN FUNCTION
function loginGoogle(req, res){
	var login = req.swagger.params.login.value;

	var fields = {
		first_name: 'first_name',
		last_name: 'last_name',
		email: 'email',
		google_id: 'google_id',
		gender: 'gender'
	};

	// promise to check to see if account exists.
	var checkAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.find({google_id: login.google_id}, function(err, result) {

				if(err) {
					// send reject as a callback
					error.makeMongooseError(err, reject)
					.then(function(error){
						reject(error);
					});
				}
				else if (result.length > 0){
					resolve(result[0]);
				}
				else {
					error.makeError("INVALID_ENTRY", "Account does not exist.")
					.then(function(error){
						reject(error);
					});
				}

			});
		})
	}


	// begin promise chain looping through promise array.
	checkAccount()
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Login Successful",
			"user": {
				account_id: _id,
				email: result.email,
				first_name: result.first_name,
				last_name: result.last_name,
				account_type: result.account_type,
				user_type: result.user_type
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		error.sendError(err.name, err.message, res);
	});
};


// LOCAL LOGIN FUNCTION: TODO
function loginLocalFromFacebook(req, res, email){

	var fields = {
		email: 'email',
		password: 'password'
	};

	// promise to check to see if account exists.
	var checkAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.find({email: login.email}, function(err, result) {

				if(err) {
					// send reject as a callback
					error.makeMongooseError(err, reject)
					.then(function(error){
						reject(error);
					});
				}
				else if (result.length > 0){
					resolve(result[0]);
				}
				else {
					error.makeError("INVALID_ENTRY", "Account does not exist.")
					.then(function(error){
						reject(error);
					});
				}

			});
		})
	}

	// create a promise to check if password matches
	var checkPassword = function(result){
		return new Promise(function(resolve, reject) {
			pass.compare(login.password, result.password)
			.then(function(isValid){
				if(isValid){
					resolve(result);
				} else {
					error.makeError("INVALID_PASSWORD", "Password incorrect")
					.then(function(error){
						reject(error);
					});
				}
			}).catch(function(err){
				reject(err);
			})
		})
	};


	// begin promise chain looping through promise array.
	checkAccount()
	.then(checkPassword)
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Login Successful",
			"user": {
				account_id: _id,
				email: result.email,
				first_name: result.first_name,
				last_name: result.last_name,
				account_type: result.account_type,
				user_type: result.user_type
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		error.sendError(err.name, err.message, res);
	});
};