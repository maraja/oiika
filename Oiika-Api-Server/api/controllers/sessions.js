
const tutorSessionModel = app.models.tutorSessionModel;
const tuteeSessionModel = app.models.tuteeSessionModel;
const tutorModel = app.models.tutorModel;

// var ObjectId = require('mongodb').ObjectId;

const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');
const moment = require('moment');

module.exports = {
	createSession: createSession,
	createBlankSession: createBlankSession,
	getTuteeSessionsByAccountId: getTuteeSessionsByAccountId
}

// function getTutorSessionByEmail(req, res) {
// 	var params = req.swagger.params;
// 	var errors = [];

// 	var getTutorId = new Promise(function(resolve, reject){
// 		if(valid.validate("email", params.email.value, errors)) {
// 			tutorModel.findOne({email: params.email.value}, {email: 1}, function(err, doc) {
// 				if(err) {
// 					reject(err);
// 				} else if (!doc){
// 					var err = error.makeError("INVALID_EMAIL", "Them email you've entered does not exist.");
// 					reject(err);
// 				} else {
// 					resolve(doc._id);
// 				}
// 			});
// 		} else {
// 			error.sendError("Error", errors[0], res);
// 		}
// 	});

// 	getTutorId.then(function(tutorId){
// 		console.log(tutorId);
// 		sessionModel.find({tutor_id: tutorId}, function(err, docs) {
// 			if(err) {
// 				error.sendError(err.name, err.message, res);
// 			}
// 			else {
// 				return res.send(docs);	
// 			}
// 		});
// 	}).catch(function(err){
// 		error.sendError(err.name, err.message, res);
// 	});
// };

// function getTuteeSessionByEmail(req, res) {
// 	var params = req.swagger.params;
// 	var errors = [];

// 	if(valid.validate("email", params.email.value, errors)) {
// 		sessionModel.find({tutee_id: params.email.value}, function(err, docs) {
// 			if(err) {
// 				console.log(err);
// 				error.sendError(err.name, err.message, res);
// 			}
// 			else {
// 				return res.send(docs);
// 			}
// 		});
// 	} else {
// 		error.sendError("Error", errors[0], res);
// 	}
// };


function getTuteeSessionsByAccountId(req, res) {
	var params = req.swagger.params;
	var tuteeId = params.tuteeId.value;

	var getSessions = function(){
		return new Promise(function(resolve, reject) {
			tuteeSessionModel.findOne(
			{
				account_id: tuteeId
			},
			{
				sessions: 1,
				_id: 0
			}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				} else if (!resultDocument) {
					return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
				} else {
					return resolve(resultDocument.sessions);
				}

			});
		});
	};

	getSessions()
	.then(function(sessions){
		return res.send(JSON.stringify(sessions))
	}).catch(function(err){
		return error.sendError(err.name, err.message, res); 
	});
};

function createBlankSession(accountId, userId, userType){

	// create blank model and id for placeholders to insert into respective collections
	var model, id;
	switch (userType){
		case "tutee":
			model = tuteeSessionModel;
			id = 'tutee_id';
			break;
		case "tutor":
			model = tutorSessionModel;
			id = 'tutor_id';
			break;
		default:
			break;
	}
	// create blank document
	return new Promise(function(resolve, reject) {

		// create empty schedule for each tutor created
		model.create({
			[id] : userId,
			account_id : accountId
	    // throw errors as necessary
		}, function(err, result) {

			if(err) {
				return error.errorHandler(err, null, null, reject, null);
			}
			else {
				return resolve(result);
			}

		});

	});

};

// TODO: revamp this for new model.
function createSession(req, res) {
	var session = req.swagger.params.session.value;

	var fields = {
		tutorId: 'tutor_id',
		date: 'date',
		duration: 'duration'
	};
	
	var fields_to_insert = {};

	// create a promise array to execute through
	var map = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		map.push(new Promise(function(resolve, reject) {

			// map input fields to db fields.
			switch(content){
				case "date":
					session[content] = new Date();
				default:
					fields_to_insert[fields[content]] = session[content];
					return resolve();
					break;
			}

		})

	)});

	// create a promise variable to insert into the database.
	var insertToDb = function(){
		return new Promise(function(resolve, reject) {

			tuteeSessionModel.findOneAndUpdate(
			{
				account_id: session.tuteeId
			},
			// set the old schedule as the new schedule
			// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
			{
				$push: {
					sessions: fields_to_insert
				}
			},
			// this will return updated document rather than old one and run validators
			{ 
				new : true,
				runValidators : true
			},
			function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				} else if (!resultDocument) {
					return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
				} else {
					return resolve(resultDocument.sessions);
				}

			});

		})
	};


	// begin promise chain looping through promise array.
	Promise.all(map)
	// post to database sending returned document down promise chain
	.then(insertToDb)
	// handle success accordingly
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Successfully inserted",
			"result": result
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		return error.sendError(err.name, err.message, res); 	
	});
};