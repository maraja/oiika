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

	// LOCAL SIGNUP FUNCTION
	// maps fields, checks if account exists by email, validates fields and then inserts.
	authLocal: (req, res) => {

		let auth = req.swagger.params.auth.value;
		let saltRounds = 10;

		let fields = {
			first_name:'first_name',
			last_name: 'last_name', 
			email: 'email',
			gender: 'gender',
			user_type: 'user_type', 
			password: 'password'
		};

		
		let fields_to_insert = {};
		fields_to_insert["account_type"] = "local";
		auth["account_type"] = "local";

		// create a promise array to execute through
		let map = [];

		// populate promise array with new promises returning resolved after validating fields and assigning
		// them into the fields_to_insert object.
		_.each(fields, (element, content) => {

			map.push(new Promise((resolve, reject) => {

				fields_to_insert[fields[content]] = auth[content];
				return resolve();

			})

		)});

		// promise to check to see if account exists.
		let checkAccount = () => {
			return new Promise((resolve, reject) => {
				accountModel.findOne({email: fields_to_insert.email.toLowerCase()}, (err, resultDocument) => {

					if(err) {
						// send reject as a callback
						return error.errorHandler(err, null, null, reject, null);
					} else if (resultDocument) {
						return error.errorHandler(err, "DUPLICATE_EMAIL", "Email already exists.", reject, null);
					} else {
						return resolve();
					}

				});
			})
		};


		// creates relevant user. If tutor, also creates schedule in schedule collection
		let createUser = newAccount => {
			switch (newAccount.user_type){
				case "tutor":

					return new Promise((resolve, reject) => {
						tutorModel.create({
							tutor_id: newAccount._id,
							currentLocation: {
								lat: (auth.location_lat ? auth.location_lat : 999),
								lng: (auth.location_lng ? auth.location_lng : -999)
							}
						}, (err, result) => {

							if(err) {
								removeFromModel(accountModel, newAccount._id);
								return error.errorHandler(err, null, null, reject, null);
							} else {
								return resolve(newAccount);
							}

						});
					});

					break;
				case "tutee":

					return new Promise((resolve, reject) => {
						tuteeModel.create({
							tutee_id: newAccount._id
						}, (err, result) => {

							if(err) {
								removeFromModel(accountModel, newAccount._id);
								return error.errorHandler(err, null, null, reject, null);
							} else {
								return resolve(newAccount);
							}

						});
					});

					break;
				default:
					break;
			}
		};


		let insertToDb = () => {
			return new Promise((resolve, reject) => {
				accountModel.create(fields_to_insert, (err, result) => {

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
		// create hashedpassword
		.then(pass.createAndAssignPassword(fields_to_insert.password, saltRounds, (hash, resolve) => {
			fields_to_insert.password = hash;
			return resolve();
		}))
		// handle password
		// post to database sending returned document down promise chain
		.then(insertToDb)
		// create user in user table and get _id to assign.
		.then(createUser)
		// handle success accordingly
		.then(result => {
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
		.catch(err => {
			return error.sendError(err.name, err.message, res); 	
		});
	},

	// FACEBOOK SIGNUP FUNCTION
	authFacebook: (req, res) => {
		
		let auth = req.swagger.params.auth.value;

		let fields = {
			first_name:'first_name', 
			last_name: 'last_name', 
			email: 'email',
			user_type: 'user_type', 
			facebook_id: 'facebook_id',
			gender: 'gender',
			profile_picture: 'profile_picture',
			user_type: "user_type"
		};

		
		let errors = [];
		let fields_to_insert = {};
		fields_to_insert["account_type"] = "facebook";
		auth["account_type"] = "facebook";

		// create a promise array to execute through
		let map = [];

		// populate promise array with new promises returning resolved after validating fields and assigning
		// them into the fields_to_insert object.
		_.each(fields, (element, content) => {

			map.push(new Promise((resolve, reject) => {

				fields_to_insert[fields[content]] = auth[content];
				return resolve();

			})

		)});

		// promise to check to see if account exists.
		let checkAccount = () => {
			return new Promise((resolve, reject) => {
				accountModel.findOne({email: fields_to_insert.email.toLowerCase()}, (err, resultDocument) => {

					if(err) {
						// send reject as a callback
						return error.errorHandler(err, null, null, reject, null);
					} else if (resultDocument) {
						return error.makeError("DUPLICATE_EMAIL", "Email already exists.")
						.then(error => {
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
		let createUser = newAccount => {
			switch (newAccount.user_type){
				case "tutor":

					return new Promise((resolve, reject) => {
						tutorModel.create({
							tutor_id: newAccount._id,
							currentLocation: {
								lat: (auth.location_lat ? auth.location_lat : 999),
								lng: (auth.location_lng ? auth.location_lng : -999)
							}
						}, (err, result) => {

							if(err) {
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								return error.errorHandler(err, null, null, reject, null);
							} else {
								return resolve(newAccount);
							}

						});
					});

					break;
				case "tutee":

					return new Promise((resolve, reject) => {
						tuteeModel.create({
							tutee_id: newAccount._id
						}, (err, result) => {

							if(err) {
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								return error.errorHandler(err, null, null, reject, null);
							} else {
								return resolve(newAccount);
							}

						});
					});

					break;
				default:
					break;
			}
		};

		// create a promise letiable to insert into the database.
		let insertToDb = () => {
			return new Promise((resolve, reject) => {
				accountModel.create(fields_to_insert, (err, result) => {

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
		.then(result => {
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
		.catch(err => {
			// sent to loginLocalFromFacebook to handle request.
			// end this api call
			if (err.name === "DUPLICATE_EMAIL") {
				return;
			// if not, continue.
			} else { 
				return error.sendError(err.name, err.message, res); 
			}
		});
	},

	// GOOGLE SIGNUP FUNCTION
	authGoogle: (req, res) => {
		let auth = req.swagger.params.auth.value;

		let fields = {
			first_name:'first_name', 
			last_name: 'last_name', 
			email: 'email',
			user_type: 'user_type', 
			google_id: 'google_id',
			gender: 'gender',
			profile_picture: 'profile_picture',
			user_type: 'user_type'
		};

		
		let errors = [];
		let fields_to_insert = {};

		fields_to_insert["account_type"] = "google";
		auth["account_type"] = "google";

		// create a promise array to execute through
		let map = [];

		// populate promise array with new promises returning resolved after validating fields and assigning
		// them into the fields_to_insert object.
		_.each(fields, (element, content) => {

			map.push(new Promise((resolve, reject) => {

					fields_to_insert[fields[content]] = auth[content];
					return resolve();

			})

		)});

		// promise to check to see if account exists.
		let checkAccount = () => {
			return new Promise((resolve, reject) => {
				accountModel.findOne({email: fields_to_insert.email.toLowerCase()}, (err, resultDocument) => {

					if(err) {
						// send reject as a callback
						return error.errorHandler(err, null, null, reject, null);
					} else if (resultDocument) {
						return error.makeError("DUPLICATE_EMAIL", "Email already exists.")
						.then(error => {
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
		let createUser = newAccount => {
			switch (newAccount.user_type){
				case "tutor":

					return new Promise((resolve, reject) => {
						tutorModel.create({
							tutor_id: newAccount._id,
							currentLocation: {
								lat: (auth.location_lat ? auth.location_lat : 999),
								lng: (auth.location_lng ? auth.location_lng : -999)
							}
						}, (err, result) => {

							if(err) {
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								return error.errorHandler(err, null, null, reject, null);
							} else {
								return resolve(newAccount);
							}

						});
					});

					break;
				case "tutee":

					return new Promise((resolve, reject) => {
						tuteeModel.create({
							tutee_id: newAccount._id
						}, (err, result) => {

							if(err) {
								// delete previously created documents before throwing error
								removeFromModel(accountModel, newAccount._id);
								return error.errorHandler(err, null, null, reject, null);
							} else {
								return resolve(newAccount);
							}

						});
					});

					break;
				default:
					break;
			}
		};

		// create a promise letiable to insert into the database.
		let insertToDb = () => {
			return new Promise((resolve, reject) => {
				accountModel.create(fields_to_insert, (err, result) => {

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
		.then(result => {
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
		.catch(err => {
			// sent to loginRedirect to handle request.
			// end this api call
			if (err.name === "DUPLICATE_EMAIL") {
				return;
			// if not, continue.
			} else { 
				return error.sendError(err.name, err.message, res); 
			}
		});
	},

	// LOCAL LOGIN FUNCTION
	loginLocal: (req, res) => {
		let login = req.swagger.params.login.value;

		let fields = {
			email: 'email',
			password: 'password'
		};

		// promise to check to see if account exists.
		let checkAccount = function(){
			return new Promise(function(resolve, reject) {
				accountModel.findOne({email: login.email.toLowerCase()}, function(err, resultDocument) {

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
		let checkPassword = function(result){
			return new Promise(function(resolve, reject) {
				pass.compare(login.password, result.password)
				.then(function(isValid){
					if(isValid){
						return resolve(result);
					} else {
						return error.errorHandler(null, "INCORRECT_CREDENTIALS", "Incorrect credentials entered.", reject, null);
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
	},





	// PUT REQUESTS
	updatePassword: (req, res) => {
	},

	updateAccountInfo: (req, res) => {
	},


	// DELETE REQUESTS
	removeAccount: (req, res) => {

		let accountId = req.swagger.params.accountId.value;

		let getAccount = () => {
			return new Promise((resolve, reject) => {
				accountModel.findOne({ _id: accountId }, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "Entered ID does not exist.", reject, res);
					} else {
						return resolve(resultDocument);
					}

				});
			})
		}

		let deleteAccount = account => {
			return new Promise((resolve, reject) => {
				accountModel.findOneAndRemove({ _id: accountId }, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "Entered ID does not exist.", reject, res);
					} else {
						return resolve(account);
					}

				});
			})
		}

		getAccount()
		.then(deleteAccount)
		.then(deletedAccount => {
			return res.send(JSON.stringify({
				"message": ("Account with email "+deletedAccount.email+' deleted.'),
				"result": deletedAccount
				// "result": result
			}))
		})
	}

};


// -------------------------------------
// HELPERS
// -------------------------------------
function loginRedirect(req, res, fields){

	// promise to check to see if account exists.
	let loginToAccount = function(){
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

	let authAccount = account => {

		return new Promise(function(resolve, reject) {
			switch (account.account_type) {

				case 'local':
					if(fields.password!==undefined){
						pass.compare(fields.password, account.password)
						.then(function(isValid){
							if(isValid){
								return resolve(account);
							} else {
								return error.errorHandler(null, "INCORRECT_CREDENTIALS", "Local account exists, but incorrect credentials entered.", reject, null);
							}
						}).catch(function(err){
							return reject(err);
						})
					} else {
						return error.errorHandler(null, "NO_PASSWORD", "Local account exists, but no password entered.", reject, null);
					}
					break;

				case 'facebook':
					if (fields.facebook_id === account.facebook_id){
						return resolve(account);
					} else {
						return error.errorHandler(null, "INCORRECT_CREDENTIALS", "Facebook account exists, but incorrect credentials entered.", reject, null);
					}
					break;

				case 'google':
					if (fields.google_id === account.google_id){
						return resolve(account);
					} else {
						return error.errorHandler(null, "INCORRECT_CREDENTIALS", "Google account exists, but incorrect credentials entered.", reject, null);
					}
					break;

				default:
					return resolve(account);
					break;
			}
		})

	}


	// begin promise chain
	loginToAccount()
	// middleware for respective login functions
	.then(authAccount)
	.then(result => {
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
	.catch(err => {
		return error.sendError(err.name, err.message, res);
	});
};

function removeFromModel(model, id){
	// delete previously created documents before throwing error
	model.findByIdAndRemove(id, function(err, offer){
		if (err){ 
			console.log("Remove error:"); 
			console.error(err); 
		}
	});
};