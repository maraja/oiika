
const sessionModel = app.models.sessionModel;
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
			sessionModel.find(
			{
				tutee_id: tuteeId
			},
			{
				_id: 0
			}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				} else if (resultDocument.length===0) {
					return error.errorHandler(null, "NO_SESSIONS", "No sessions exist for the entered user.", reject, null);
				} else {
					return resolve(resultDocument);
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


// TODO: revamp this for new model.
function createSession(req, res) {
	var session = req.swagger.params.session.value;

	var fields = {
		tutorId: 'tutor_id',
		tuteeId: 'tutee_id',
		subjectId: 'subject_id',
		hourly_rate: 'hourly_rate',
		date: 'date',
		timeslots: 'timeslots'
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

			sessionModel.create(fields_to_insert, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				}
				else {
					return resolve(resultDocument);
				}

			});

		});
	};


	// begin promise chain looping through promise array.
	Promise.all(map)
	// post to database sending returned document down promise chain
	.then(insertToDb)
	// handle success accordingly
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Successfully created",
			"result": result
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		return error.sendError(err.name, err.message, res); 	
	});
};