const accountModel = app.models.accountModel;
const tutorModel = app.models.tutorModel;
const tuteeModel = app.models.tuteeModel;

const valid = require('../helpers/validations');
const error = require('../helpers/errors');
// password creater helper
const pass = require('../helpers/password');
const tutor = require('./tutor');
// used to create blank schedules and reviews upon tutor creation
const schedules = require('./schedules');
const reviews = require('./reviews');
const sessions = require('./sessions');
// used to redirect to facebooklogin and googlelogin upon signup
const login = require('./login');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	signupLocal: signupLocal,
	signupFacebook: signupFacebook,
	signupGoogle: signupGoogle
};

// LOCAL SIGNUP FUNCTION
// maps fields, checks if account exists by email, validates fields and then inserts.
function signupLocal(req, res){
	var signup = req.swagger.params.signup.value;
	var saltRounds = 10;

	var fields = {
		first_name:'first_name', 
		last_name: 'last_name', 
		email: 'email',
		gender: 'gender',
		account_type: 'account_type',
		user_type: 'user_type', 
		password: 'password'
	};

	
	var errors = [];
	var fields_to_insert = {};
	fields_to_insert.account_type = "local";

	// create a promise array to execute through
	var validations = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		validations.push(new Promise(function(resolve, reject) {

			// check for required and non required fields to validate accordingly.
			switch (content){
				case "first_name":
				case "last_name":
				case "email":
				case "password":
				case "user_type":
					if (valid.validate(content, signup[content], errors, true)){
						fields_to_insert[fields[content]] = signup[content];
					}
					break;
				case "gender":
					if (valid.validate(content, signup[content], errors, false)){
						fields_to_insert[fields[content]] = signup[content];
					}
					break;
				default:
					break;
			}

			resolve();

		})

	)});

	// promise to check to see if account exists.
	var checkAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.find({email: fields_to_insert.email}, function(err, result) {

				if(err) {
					error.makeMongooseError(err)
					.then(function(error){
						reject(error);
					});
				}
				else if (result.length > 0){
					error.makeError("DUPLICATE_EMAIL", "Email already exists.")
					.then(function(error){
						reject(error);
					});
				}
				else {
					resolve();
				}

			});
		})
	};


	// creates relevant user. If tutor, also creates schedule in schedule collection
	var createUser = function(newAccount){
		switch (newAccount.user_type){
			case "tutor":

				return new Promise(function(resolve, reject) {
					tutorModel.create({
						account_id: newAccount._id,
						first_name: fields_to_insert.first_name,
						last_name: fields_to_insert.last_name,
						email: fields_to_insert.email,
						account_type: fields_to_insert.account_type,
						currentLocation: {
							lat: 999,
							lng: -999
						}
					}, function(err, result) {

						if(err) {
							// delete previously created documents before throwing error
							removeFromModel(accountModel, newAccount._id);
							// send reject as a callback
							error.makeMongooseError(err)
							.then(function(error){
								reject(error);
							});
						}
						else {
							// create blank tutor schedule
							schedules.createBlankSchedule(newAccount._id, result._id)
							// create blank tutor reviews
							.then(reviews.createBlankReview(newAccount._id, result._id))
							// create blank tutor sessions
							.then(sessions.createBlankSession(newAccount._id, result._id, 'tutor'))
							// if returned successfully, resolve and continue.
							.then(function(){
								resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								error.sendError(err.name, err.message, res);
							});
						}

					});
				});

				break;
			case "tutee":

				return new Promise(function(resolve, reject) {
					tuteeModel.create({
						account_id: newAccount._id,
						first_name: fields_to_insert.first_name,
						last_name: fields_to_insert.last_name,
						email: fields_to_insert.email,
						account_type: fields_to_insert.account_type
					}, function(err, result) {

						if(err) {
							// delete previously created documents before throwing error
							removeFromModel(accountModel, newAccount._id);
							// send reject as a callback
							error.makeMongooseError(err)
							.then(function(error){
								reject(error);
							});
						}
						else {
							// create blank tutee sessions
							sessions.createBlankSession(newAccount._id, result._id, 'tutee')
							// if returned successfully, resolve and continue.
							.then(function(){
								resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								error.sendError(err.name, err.message, res);
							});
						}

					});
				});

				break;
			default:
				break;
		}
	};


	// create a promise variable to insert into the database.
	var insertToDb = function(){
		return new Promise(function(resolve, reject) {
			accountModel.create(fields_to_insert, function(err, result) {

				if(err) {
					// send reject as a callback
					error.makeMongooseError(err)
					.then(function(error){
						reject(error);
					});
				}
				else {
					resolve(result);
				}

			});
		})
	};


	// begin promise chain looping through promise array.
	Promise.all(validations)
	// check for errors before posting to database
	.then(function(){
		return new Promise(function(resolve, reject) {
			if(errors.length > 0){
				error.makeError("VALIDATION_ERROR", errors)
				.then(function(error){
					reject(error);
				});
			} else { resolve(); }
		})
	})
	// check to see if account exists.
	.then(checkAccount)
	// create hashedpassword
	.then(pass.createAndAssignPassword(fields_to_insert.password, saltRounds, function(hash, resolve){
		fields_to_insert.password = hash;
		resolve();
	}))
	// handle password
	// post to database sending returned document down promise chain
	.then(insertToDb)
	// create user in user table and get _id to assign.
	.then(createUser)
	// handle success accordingly
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Successfully inserted",
			"result": {
				account_id: result._id,
				account_type: result.account_type,
				first_name: result.first_name,
				last_name: result.last_name,
				email: result.email,
				gender: result.gender,
				user_type: result.user_type
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		error.sendError(err.name, err.message, res);
	});
};


// FACEBOOK SIGNUP FUNCTION
function signupFacebook(req, res){
	
	var signup = req.swagger.params.signup.value;

	var fields = {
		first_name:'first_name', 
		last_name: 'last_name', 
		email: 'email',
		account_type: 'account_type',
		user_type: 'user_type', 
		facebook_id: 'facebook_id',
		gender: 'gender',
		profile_picture: 'profile_picture',
		user_type: "user_type"
	};

	
	var errors = [];
	var fields_to_insert = {};
	fields_to_insert.account_type = "facebook";

	// create a promise array to execute through
	var validations = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		validations.push(new Promise(function(resolve, reject) {

			// check for required and non required fields to validate accordingly.
			switch (content){
				case "first_name":
				case "last_name":
				case "email":
				case "user_type":
				case "facebook_id":
					if (valid.validate(content, signup[content], errors, true)){
						fields_to_insert[fields[content]] = signup[content];
					}
					break;
				case "gender":
				case "profile_picture":
					if (valid.validate(content, signup[content], errors, false)){
						fields_to_insert[fields[content]] = signup[content];
					}
					break;
				default:
					break;
			}

			resolve();

		})

	)});

	// promise to check to see if account exists.
	var checkAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.find({email: fields_to_insert.email}, function(err, result) {

				if(err) {
					// send reject as a callback
					error.makeMongooseError(err)
					.then(function(error){
						reject(error);
					});
				}
				else if (result.length > 0){
					error.makeError("DUPLICATE_EMAIL", "Email already exists.")
					.then(function(error){
						login.loginLocalFromFacebook(req, res, fields_to_insert.email);
						reject(error);
					});
				}
				else {
					resolve();
				}

			});
		})
	};


	// creates relevant user. If tutor, also creates schedule in schedule collection
	var createUser = function(newAccount){
		switch (newAccount.user_type){
			case "tutor":

				return new Promise(function(resolve, reject) {
					tutorModel.create({
						account_id: newAccount._id,
						first_name: fields_to_insert.first_name,
						last_name: fields_to_insert.last_name,
						email: fields_to_insert.email,
						account_type: fields_to_insert.account_type,
						currentLocation: {
							lat: 999,
							lng: -999
						}
					}, function(err, result) {

						if(err) {
							// delete previously created documents before throwing error
							removeFromModel(accountModel, newAccount._id);
							// send reject as a callback
							error.makeMongooseError(err)
							.then(function(error){
								reject(error);
							});
						}
						else {
							// create blank tutor schedule
							schedules.createBlankSchedule(newAccount._id, result._id)
							// create blank tutor reviews
							.then(reviews.createBlankReview(newAccount._id, result._id))
							// create blank tutor sessions
							.then(sessions.createBlankSession(newAccount._id, result._id, 'tutor'))
							// if returned successfully, resolve and continue.
							.then(function(){
								resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								error.sendError(err.name, err.message, res);
							});
						}

					});
				});

				break;
			case "tutee":

				return new Promise(function(resolve, reject) {
					tuteeModel.create({
						account_id: newAccount._id,
						first_name: fields_to_insert.first_name,
						last_name: fields_to_insert.last_name,
						email: fields_to_insert.email,
						account_type: fields_to_insert.account_type
					}, function(err, result) {

						if(err) {
							// delete previously created documents before throwing error
							removeFromModel(accountModel, newAccount._id);
							// send reject as a callback
							error.makeMongooseError(err)
							.then(function(error){
								reject(error);
							});
						}
						else {
							// create blank tutee sessions
							sessions.createBlankSession(newAccount._id, result._id, 'tutee')
							// if returned successfully, resolve and continue.
							.then(function(){
								resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								error.sendError(err.name, err.message, res);
							});
						}

					});
				});

				break;
			default:
				break;
		}
	};

	// create a promise variable to insert into the database.
	var insertToDb = function(){
		return new Promise(function(resolve, reject) {
			accountModel.create(fields_to_insert, function(err, result) {

				if(err) {
					// send reject as a callback
					error.makeMongooseError(err)
					.then(function(error){
						reject(error);
					});
				}
				else {
					resolve(result);
				}

			});
		})
	};


	// begin promise chain looping through promise array.
	Promise.all(validations)
	// check for errors before posting to database
	.then(function(){
		return new Promise(function(resolve, reject) {
			if(errors.length > 0){
				error.makeError("VALIDATION_ERROR", errors)
				.then(function(error){
					reject(error);
				});
			} else { resolve(); }
		})
	})
	// check to see if account exists.
	.then(checkAccount)
	// post to database sending returned document down promise chain
	.then(insertToDb)
	// create user in user table and get _id to assign.
	.then(createUser)
	// handle success accordingly
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Successfully inserted",
			"result": {
				account_id: result._id,
				account_type: result.account_type,
				first_name: result.first_name,
				last_name: result.last_name,
				email: result.email,
				gender: result.gender,
				user_type: result.user_type
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		// sent to loginLocalFromFacebook to handle request.
		// end this api call
		if (err.name === "DUPLICATE_EMAIL") {
			return;
		// if not, continue.
		} else { 
			error.sendError(err.name, err.message, res); 
		}
	});
};


// GOOGLE SIGNUP FUNCTION
function signupGoogle(req, res){
	var signup = req.swagger.params.signup.value;

	var fields = {
		first_name:'first_name', 
		last_name: 'last_name', 
		email: 'email',
		account_type: 'account_type',
		user_type: 'user_type', 
		google_id: 'google_id',
		gender: 'gender',
		profile_picture: 'profile_picture',
		user_type: "user_type"
	};

	
	var errors = [];
	var fields_to_insert = {};
	fields_to_insert.account_type = "google";

	// create a promise array to execute through
	var validations = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		validations.push(new Promise(function(resolve, reject) {

			// check for required and non required fields to validate accordingly.
			switch (content){
				case "first_name":
				case "last_name":
				case "email":
				case "user_type":
				case "google_id":
					if (valid.validate(content, signup[content], errors, true)){
						fields_to_insert[fields[content]] = signup[content];
					}
					break;
				case "gender":
				case "profile_picture":
					if (valid.validate(content, signup[content], errors, false)){
						fields_to_insert[fields[content]] = signup[content];
					}
					break;
				default:
					break;
			}

			resolve();

		})

	)});

	// promise to check to see if account exists.
	var checkAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.find({email: fields_to_insert.email}, function(err, result) {

				if(err) {
					// send reject as a callback
					error.makeMongooseError(err)
					.then(function(error){
						reject(error);
					});
				}
				else if (result.length > 0){
					error.makeError("DUPLICATE_EMAIL", "Email already exists.")
					.then(function(error){
						login.loginLocalFromGoogle(req, res, fields_to_insert.email);
						reject(error);
					});
				}
				else {
					resolve();
				}

			});
		})
	};


	// creates relevant user. If tutor, also creates schedule in schedule collection
	var createUser = function(newAccount){
		switch (newAccount.user_type){
			case "tutor":

				return new Promise(function(resolve, reject) {
					tutorModel.create({
						account_id: newAccount._id,
						first_name: fields_to_insert.first_name,
						last_name: fields_to_insert.last_name,
						email: fields_to_insert.email,
						account_type: fields_to_insert.account_type,
						currentLocation: {
							lat: 999,
							lng: -999
						}
					}, function(err, result) {

						if(err) {
							// delete previously created documents before throwing error
							removeFromModel(accountModel, newAccount._id);
							// send reject as a callback
							error.makeMongooseError(err)
							.then(function(error){
								reject(error);
							});
						}
						else {
							// create blank tutor schedule
							schedules.createBlankSchedule(newAccount._id, result._id)
							// create blank tutor reviews
							.then(reviews.createBlankReview(newAccount._id, result._id))
							// create blank tutor sessions
							.then(sessions.createBlankSession(newAccount._id, result._id, 'tutor'))
							// if returned successfully, resolve and continue.
							.then(function(){
								resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								error.sendError(err.name, err.message, res);
							});
						}

					});
				});

				break;
			case "tutee":

				return new Promise(function(resolve, reject) {
					tuteeModel.create({
						account_id: newAccount._id,
						first_name: fields_to_insert.first_name,
						last_name: fields_to_insert.last_name,
						email: fields_to_insert.email,
						account_type: fields_to_insert.account_type
					}, function(err, result) {

						if(err) {
							// delete previously created documents before throwing error
							removeFromModel(accountModel, newAccount._id);
							// send reject as a callback
							error.makeMongooseError(err)
							.then(function(error){
								reject(error);
							});
						}
						else {
							// create blank tutee sessions
							sessions.createBlankSession(newAccount._id, result._id, 'tutee')
							// if returned successfully, resolve and continue.
							.then(function(){
								resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								error.sendError(err.name, err.message, res);
							});
						}

					});
				});

				break;
			default:
				break;
		}
	};

	// create a promise variable to insert into the database.
	var insertToDb = function(){
		return new Promise(function(resolve, reject) {
			accountModel.create(fields_to_insert, function(err, result) {

				if(err) {
					// send reject as a callback
					error.makeMongooseError(err)
					.then(function(error){
						reject(error);
					});
				}
				else {
					resolve(result);
				}

			});
		})
	};


	// begin promise chain looping through promise array.
	Promise.all(validations)
	// check for errors before posting to database
	.then(function(){
		return new Promise(function(resolve, reject) {
			if(errors.length > 0){
				error.makeError("VALIDATION_ERROR", errors)
				.then(function(error){
					reject(error);
				});
			} else { resolve(); }
		})
	})
	// check to see if account exists.
	.then(checkAccount)
	// post to database sending returned document down promise chain
	.then(insertToDb)
	// create user in user table and get _id to assign.
	.then(createUser)
	// handle success accordingly
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Successfully inserted",
			"result": {
				account_id: result._id,
				account_type: result.account_type,
				first_name: result.first_name,
				last_name: result.last_name,
				email: result.email,
				gender: result.gender,
				user_type: result.user_type
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		// sent to loginLocalFromGoogle to handle request.
		// end this api call
		if (err.name === "DUPLICATE_EMAIL") {
			return;
		// if not, continue.
		} else { 
			error.sendError(err.name, err.message, res); 
		}
	});
};



// helper functions
function removeFromModel(model, id){
	// delete previously created documents before throwing error
	model.findByIdAndRemove(id, function(err, offer){
		if (err){ 
			console.log("Remove error:"); 
			console.error(err); 
		}
	});
};