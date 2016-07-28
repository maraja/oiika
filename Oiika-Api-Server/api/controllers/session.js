
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
	getTutorSessionByEmail: getTutorSessionByEmail,
	getTuteeSessionByEmail: getTuteeSessionByEmail
}

function getTutorSessionByEmail(req, res) {
	var params = req.swagger.params;
	var errors = [];

	var getTutorId = new Promise(function(resolve, reject){
		if(valid.validate("email", params.email.value, errors)) {
			tutorModel.findOne({email: params.email.value}, {email: 1}, function(err, doc) {
				if(err) {
					reject(err);
				} else if (!doc){
					var err = error.makeError("INVALID_EMAIL", "Them email you've entered does not exist.");
					reject(err);
				} else {
					resolve(doc._id);
				}
			});
		} else {
			error.sendError("Error", errors[0], res);
		}
	});

	getTutorId.then(function(tutorId){
		console.log(tutorId);
		sessionModel.find({tutor_id: tutorId}, function(err, docs) {
			if(err) {
				error.sendError(err.name, err.message, res);
			}
			else {
				return res.send(docs);	
			}
		});
	}).catch(function(err){
		error.sendError(err.name, err.message, res);
	});
}

function getTuteeSessionByEmail(req, res) {
	var params = req.swagger.params;
	var errors = [];

	if(valid.validate("email", params.email.value, errors)) {
		sessionModel.find({tutee_id: params.email.value}, function(err, docs) {
			if(err) {
				console.log(err);
				error.sendError(err.name, err.message, res);
			}
			else {
				return res.send(docs);
			}
		});
	} else {
		error.sendError("Error", errors[0], res);
	}
}

function createSession(req, res) {
	var session = req.swagger.params.session.value;
	// field mapping with database names as values
	var fields = {
		tutor_email:'tutor_id', 
		tutee_email: 'tutee_id', 
		subject: 'subject_id',
		datetime: 'datetime', 
		duration: 'duration',
		hourly_rate: 'hourly_rate'
	};

	var errors = [];
	var fields_to_insert = {};

	// create a promise array to execute through
	var promises = [];

	promises.push(new Promise(function(resolve, reject){
		sessionModel.find({tutee_id: params.email.value}, function(err, docs) {
			if(err) {
				console.log(err);
				error.sendError(err.name, err.message, res);
			}
			else {
				return res.send(docs);
			}
		});
	}))

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		promises.push(new Promise(function(resolve, reject) {

			// check for required and non required fields to validate accordingly.
			switch (content){
				// required fields
				case "tutor_email":
				case "tutee_email":
				case "subject":
				case "datetime":
					if (valid.validate(content, session[content], errors, true)){
						fields_to_insert[fields[content]] = session[content];
					}
					break;
				// not required fields
				case "duration":
				case "hourly_rate":
					if (valid.validate(content, session[content], errors, false)){
						fields_to_insert[fields[content]] = session[content];
					}
					break;
				default:
					break;
			}

			resolve();

		})

	)});

	// create a promise variable to insert into the database.
	var insertToDb = function(){
		return new Promise(function(resolve, reject) {
			sessionModel.create(fields_to_insert, function(err, result) {

				if(err) {
					console.log(err); 
					reject("Something happened");
				}
				else {
					resolve(result);
				}

			});
		})
	};

	// begin promise chain looping through promise array.
	Promise.all(promises)
	// check for errors before posting to database
	.then(function(){
		return new Promise(function(resolve, reject) {
			if(errors.length > 0){
				return res.send(JSON.stringify({
					"Fail": "Failed to post with errors",
					"errors": errors
				}))
				reject("Error");
			} else { resolve(); }
		})
	})
	// post to database sending returned document down promise chain
	.then(insertToDb)
	// handle success accordingly
	.then(function(result){
		
		return res.send(JSON.stringify({
			"Success": "Successfully inserted",
			"Result": result,
			"formatted_date": moment.utc(result.datetime).toDate().toString()
		}))

	})
	// catch all errors and handle accordingly
	.catch(function(err){
		error.sendError(err.name, err.message, res);
	});

	// var first_name = tutor.first_name;
	// var last_name = tutor.last_name;
	// var email = tutor.email;
	// var short_description = tutor.short_description;
	// var full_description = tutor.full_description;
	// var city = tutor.city;
	// var hourly_rate = tutor.hourly_rate;
	// var hours_worked = tutor.hours_worked;
	// var rating = tutor.rating;
	// var skills = tutor.skills;
	// var profile_picture = tutor.profile_picture;
}