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
// used to redirect to facebooklogin and googlelogin upon auth
const login = require('./login');

const Promise = require('bluebird');
const _ = require('underscore');

module.exports = {
	authLocal: authLocal,
	authFacebook: authFacebook,
	authGoogle: authGoogle
};

// LOCAL SIGNUP FUNCTION
// maps fields, checks if account exists by email, validates fields and then inserts.
function authLocal(req, res){
	var auth = req.swagger.params.auth.value;
	var saltRounds = 10;

	var fields = {
		first_name:'first_name',
		last_name: 'last_name', 
		email: 'email',
		gender: 'gender',
		user_type: 'user_type', 
		password: 'password'
	};

	
	var fields_to_insert = {};
	fields_to_insert["account_type"] = "local";
	auth["account_type"] = "local";

	// create a promise array to execute through
	var map = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		map.push(new Promise(function(resolve, reject) {

			// map input fields to db fields.
			// switch(content){
			// 	case "email":
			// 		auth[content] = auth[content].toLowerCase();
			// 	default:
					fields_to_insert[fields[content]] = auth[content];
					resolve();
					// break;
			// }

		})

	)});

	// promise to check to see if account exists.
	var checkAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.findOne({email: fields_to_insert.email.toLowerCase()}, function(err, resultDocument) {

				if(err) {
					// send reject as a callback
					return error.errorHandler(err, null, null, reject, null);
				} else if (resultDocument) {
					return error.makeError("DUPLICATE_EMAIL", "Email already exists.")
					.then(function(error){
						loginRedirect(req, res, auth);
						return reject(error);
					});
				} else {
					return resolve();
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
							lat: (auth.location_lat ? auth.location_lat : 999),
							lng: (auth.location_lng ? auth.location_lng : -999)
						}
					}, function(err, result) {

						if(err) {
							// delete previously created documents before throwing error
							removeFromModel(accountModel, newAccount._id);
							// send reject as a callback
							return error.errorHandler(err, null, null, reject, null);
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
								return resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								return error.sendError(err.name, err.message, res);
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
							return error.errorHandler(err, null, null, reject, null);
						}
						else {
							// create blank tutee sessions
							sessions.createBlankSession(newAccount._id, result._id, 'tutee')
							// if returned successfully, resolve and continue.
							.then(function(){
								return resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								return error.sendError(err.name, err.message, res);
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
					return error.errorHandler(err, null, null, reject, null);
				}
				else {
					return resolve(result);
				}

			});
		})
	};


	// begin promise chain looping through promise array.
	Promise.all(map)
	// check to see if account exists.
	.then(checkAccount)
	// create hashedpassword
	.then(pass.createAndAssignPassword(fields_to_insert.password, saltRounds, function(hash, resolve){
		fields_to_insert.password = hash;
		return resolve();
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
				user_type: result.user_type,
				profile_picture: result.profile_picture
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
			return error.sendError(err.name, err.message, res); 
		}
	});
};


// FACEBOOK SIGNUP FUNCTION
function authFacebook(req, res){
	
	var auth = req.swagger.params.auth.value;

	var fields = {
		first_name:'first_name', 
		last_name: 'last_name', 
		email: 'email',
		user_type: 'user_type', 
		facebook_id: 'facebook_id',
		gender: 'gender',
		profile_picture: 'profile_picture',
		user_type: "user_type"
	};

	
	var errors = [];
	var fields_to_insert = {};
	fields_to_insert["account_type"] = "facebook";
	auth["account_type"] = "local";

	// create a promise array to execute through
	var map = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		map.push(new Promise(function(resolve, reject) {

			// map input fields to db fields.
			// switch(content){
			// 	case "email":
			// 		auth[content] = auth[content].toLowerCase();
			// 	default:
					fields_to_insert[fields[content]] = auth[content];
					resolve();
					// break;
			// }

		})

	)});

	// promise to check to see if account exists.
	var checkAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.findOne({email: fields_to_insert.email.toLowerCase()}, function(err, resultDocument) {

				if(err) {
					// send reject as a callback
					return error.errorHandler(err, null, null, reject, null);
				} else if (resultDocument) {
					return error.makeError("DUPLICATE_EMAIL", "Email already exists.")
					.then(function(error){
						loginRedirect(req, res, auth);
						return reject(error);
					});
				} else {
					return resolve();
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
							lat: (auth.location_lat ? auth.location_lat : 999),
							lng: (auth.location_lng ? auth.location_lng : -999)
						}
					}, function(err, result) {

						if(err) {
							// delete previously created documents before throwing error
							removeFromModel(accountModel, newAccount._id);
							// send reject as a callback
							return error.errorHandler(err, null, null, reject, null);
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
								return resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								return error.sendError(err.name, err.message, res);
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
							return error.errorHandler(err, null, null, reject, null);
						}
						else {
							// create blank tutee sessions
							sessions.createBlankSession(newAccount._id, result._id, 'tutee')
							// if returned successfully, resolve and continue.
							.then(function(){
								return resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								return error.sendError(err.name, err.message, res);
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
					return error.errorHandler(err, null, null, reject, null);
				}
				else {
					return resolve(result);
				}

			});
		})
	};


	// begin promise chain looping through promise array.
	Promise.all(map)
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
				user_type: result.user_type,
				profile_picture: result.profile_picture
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
			return error.sendError(err.name, err.message, res); 
		}
	});
};


// GOOGLE SIGNUP FUNCTION
function authGoogle(req, res){
	var auth = req.swagger.params.auth.value;

	var fields = {
		first_name:'first_name', 
		last_name: 'last_name', 
		email: 'email',
		user_type: 'user_type', 
		google_id: 'google_id',
		gender: 'gender',
		profile_picture: 'profile_picture',
		user_type: "user_type"
	};

	
	var errors = [];
	var fields_to_insert = {};
	fields_to_insert["account_type"] = "google";
	auth["account_type"] = "local";

	// create a promise array to execute through
	var map = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		map.push(new Promise(function(resolve, reject) {

			// map input fields to db fields.
			// switch(content){
			// 	case "email":
			// 		auth[content] = auth[content].toLowerCase();
			// 	default:
					fields_to_insert[fields[content]] = auth[content];
					resolve();
					// break;
			// }

		})

	)});

	// promise to check to see if account exists.
	var checkAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.findOne({email: fields_to_insert.email.toLowerCase()}, function(err, resultDocument) {

				if(err) {
					// send reject as a callback
					return error.errorHandler(err, null, null, reject, null);
				} else if (resultDocument) {
					return error.makeError("DUPLICATE_EMAIL", "Email already exists.")
					.then(function(error){
						loginRedirect(req, res, auth);
						return reject(error);
					});
				} else {
					return resolve();
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
							lat: (auth.location_lat ? auth.location_lat : 999),
							lng: (auth.location_lng ? auth.location_lng : -999)
						}
					}, function(err, result) {

						if(err) {
							// delete previously created documents before throwing error
							removeFromModel(accountModel, newAccount._id);
							// send reject as a callback
							return error.errorHandler(err, null, null, reject, null);
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
								return resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								return error.sendError(err.name, err.message, res);
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
							return error.errorHandler(err, null, null, reject, null);
						}
						else {
							// create blank tutee sessions
							sessions.createBlankSession(newAccount._id, result._id, 'tutee')
							// if returned successfully, resolve and continue.
							.then(function(){
								return resolve(newAccount);
							})
							// catch all errors and handle accordingly
							.catch(function(err){
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								removeFromModel(userModel, result._id);
								return error.sendError(err.name, err.message, res);
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
					return error.errorHandler(err, null, null, reject, null);
				} else {
					return resolve(result);
				}

			});
		})
	};


	// begin promise chain looping through promise array.
	Promise.all(map)
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
				user_type: result.user_type,
				profile_picture: result.profile_picture
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
			return error.sendError(err.name, err.message, res); 
		}
	});
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
			accountModel.findOne({email: login.email.toLowerCase()}, function(err, resulDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				}
				else if (!resultDocument){
					return error.errorHandler(null, "INVALID_ENTRY", "Account does not exist.", reject, null);
				}
				else {
					return resolve(resultDocument);
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
					return resolve(result);
				} else {
					return error.errorHandler(null, "INVALID_PASSWORD", "Password incorrect", reject, null);
				}
			}).catch(function(err){
				return reject(err);
			})
		})
	};


	// begin promise chain looping through promise array.
	checkAccount()
	.then(checkPassword)
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Login Successful",
			"result": {
				account_id: result._id,
				email: result.email,
				first_name: result.first_name,
				last_name: result.last_name,
				account_type: result.account_type,
				user_type: result.user_type,
				profile_picture: result.profile_picture
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		return error.sendError(err.name, err.message, res);
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
			accountModel.findOne({
				email: login.email.toLowerCase(),
				facebook_id: login.facebook_id
			}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				}
				else if (!resultDocument){
					return error.errorHandler(null, "INVALID_ENTRY", "Account does not exist.", reject, null);
				}
				else {
					return resolve(resultDocument);
				}

			});
		})
	}


	// begin promise chain looping through promise array.
	checkAccount()
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Login Successful",
			"result": {
				account_id: result._id,
				email: result.email,
				first_name: result.first_name,
				last_name: result.last_name,
				account_type: result.account_type,
				user_type: result.user_type,
				profile_picture: result.profile_picture
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		return error.sendError(err.name, err.message, res);
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
			accountModel.findOne({
				email: login.email.toLowerCase(),
				google_id: login.google_id
			}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				}
				else if (!resultDocument){
					return error.errorHandler(null, "INVALID_ENTRY", "Account does not exist.", reject, null);
				}
				else {
					return resolve(resultDocument);
				}

			});
		})
	}


	// begin promise chain looping through promise array.
	checkAccount()
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Login Successful",
			"result": {
				account_id: result._id,
				email: result.email,
				first_name: result.first_name,
				last_name: result.last_name,
				account_type: result.account_type,
				user_type: result.user_type,
				profile_picture: result.profile_picture
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		return error.sendError(err.name, err.message, res);
	});
};


// LOCAL LOGIN FUNCTION redirected from facebook auth if email exists
function loginLocalFromFacebook(req, res, email){

	// promise to check to see if account exists.
	var loginToFacebookAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.findOne({email: email.toLowerCase()}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				}
				else if (!resultDocument){
					return error.errorHandler(null, "INVALID_ENTRY", "Account does not exist.", reject, null);
				}
				else {
					return resolve(resultDocument);
				}

			});
		})
	}


	// begin promise chain looping through promise array.
	loginToFacebookAccount()
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "This account already exists - login successful via Facebook",
			"result": {
				account_id: result._id,
				email: result.email,
				first_name: result.first_name,
				last_name: result.last_name,
				account_type: result.account_type,
				user_type: result.user_type,
				profile_picture: result.profile_picture
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		return error.sendError(err.name, err.message, res);
	});
};


// LOCAL LOGIN FUNCTION redirected from google auth if email exists
function loginLocalFromGoogle(req, res, email){

	// promise to check to see if account exists.
	var loginToGoogleAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.findOne({email: email.toLowerCase()}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				}
				else if (!resultDocument){
					return error.errorHandler(null, "INVALID_ENTRY", "Account does not exist.", reject, null);
				}
				else {
					return resolve(resultDocument);
				}

			});
		})
	}


	// begin promise chain looping through promise array.
	loginToGoogleAccount()
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "This account already exists - login successful via Google",
			"result": {
				account_id: result._id,
				email: result.email,
				first_name: result.first_name,
				last_name: result.last_name,
				account_type: result.account_type,
				user_type: result.user_type,
				profile_picture: result.profile_picture
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		return error.sendError(err.name, err.message, res);
	});
};


function loginRedirect(req, res, fields){


	// promise to check to see if account exists.
	var loginToAccount = function(){
		return new Promise(function(resolve, reject) {
			accountModel.findOne({email: fields.email.toLowerCase()}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				}
				else if (!resultDocument){
					return error.errorHandler(null, "INVALID_ENTRY", "Account does not exist.", reject, null);
				}
				else {
					return resolve(resultDocument);
				}

			});
		})
	}


	// begin promise chain
	loginToAccount()
	// middleware for respective login functions
	.then(function(result){
		return new Promise(function(resolve, reject) {
			switch (result.account_type) {
				case 'local':
					if(fields.password!==undefined){
						pass.compare(fields.password, result.password)
						.then(function(isValid){
							if(isValid){
								return resolve(result);
							} else {
								return error.errorHandler(null, "INCORRECT_PASSWORD", "Local account exists, but password incorrect.", reject, null);
							}
						}).catch(function(err){
							return reject(err);
						})
					} else {
						return error.errorHandler(null, "NO_PASSWORD", "Local account exists, but no password entered.", reject, null);
					}
					break;
				case 'facebook':
					if (fields.facebook_id === result.facebook_id){
						return resolve(result);
					} else {
						return error.errorHandler(null, "INCORRECT_ID", "Facebook account exists, but facebook id incorrect.", reject, null);
					}
					break;
				case 'google':
					if (fields.google_id === result.google_id){
						return resolve(result);
					} else {
						return error.errorHandler(null, "INCORRECT_ID", "Google account exists, but google id incorrect.", reject, null);
					}
					break;
				default:
					return resolve(result);
					break;
			}
		})
	})
	.then(function(result){
		return res.send(JSON.stringify({
			"message": ("This account already exists - login successful via "+result.account_type),
			"result": {
				account_id: result._id,
				email: result.email,
				first_name: result.first_name,
				last_name: result.last_name,
				account_type: result.account_type,
				user_type: result.user_type,
				profile_picture: result.profile_picture
			}
			// "result": result
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		return error.sendError(err.name, err.message, res);
	});

};



// -------------------------------------
// HELPERS
// -------------------------------------
function removeFromModel(model, id){
	// delete previously created documents before throwing error
	model.findByIdAndRemove(id, function(err, offer){
		if (err){ 
			console.log("Remove error:"); 
			console.error(err); 
		}
	});
};