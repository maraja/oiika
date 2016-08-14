
const scheduleModel = app.models.scheduleModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');


const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	getTutorScheduleByAccountId: getTutorScheduleByAccountId,
	updateSchedule: updateSchedule,
	createBlankSchedule: createBlankSchedule,
	updateScheduleExceptions: updateScheduleExceptions
};

// create schedule function
function createBlankSchedule(accountId, tutorId){

	return new Promise(function(resolve, reject) {

		// create empty schedule for each tutor created
		scheduleModel.create({
			tutor_id: tutorId,
			account_id: accountId,
			schedule: {
				"0": "-1",
				"1": "-1",
				"2": "-1",
				"3": "-1",
				"4": "-1",
				"5": "-1",
				"6": "-1"
	      	}
	    // throw errors as necessary
		}, function(err, result) {

			if(err) {
				error.makeMongooseError(err)
				.then(function(error){
					reject(error);
				});
			}
			else {
				resolve(result);
			}

		});

	});
};

function getTutorScheduleByAccountId(accountId){
	return new Promise(function(resolve, reject) {

		scheduleModel.find(
		{
			account_id: accountId
		},
		{
			schedule: 1,
			_id: 0
		}, function(err, resultDocument) {

			if(err) {
				console.log(error);
				switch (err.name){
					case "CastError":
					case "MongoError":
						error.makeError(err.name, err.message)
						.then(function(error){
							reject(error);
						});
						break;
					default:
						error.makeMongooseError(err)
						.then(function(error){
							reject(error);
						});
						break;
				}
			} else if (resultDocument.length==0){
				error.makeError("INVALID_ID", "ID does not exist.")
				.then(function(error){
					reject(error);
				});
			} else {
				resolve(resultDocument[0].schedule);
			}

		});

	});
};

// update schedule by account id
function updateSchedule(schedule){

	return new Promise(function(resolve, reject) {

		scheduleModel.findOneAndUpdate(
		{
			account_id: schedule.tutorId
		},
		// set the old schedule as the new schedule
		// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
		{
			$set: {
				schedule: schedule.schedule
			}
		},
		// this will return updated document rather than old one
		{ 
			new : true,
			runValidators : true 
		},
		function(err, resultDocument) {

			if(err) {
				switch (err.name){
					case "CastError":
					case "MongoError":
						error.makeError(err.name, err.message)
						.then(function(error){
							reject(error);
						});
						break;
					default:
						error.makeMongooseError(err)
						.then(function(error){
							reject(error);
						});
						break;
				}
			} else if (!resultDocument){
				error.makeError("INVALID_ID", "ID does not exist.")
				.then(function(error){
					reject(error);
				});
			} else {
				resolve(resultDocument);
			}

		});

	});
};

function updateScheduleExceptions(req, res){

	var params = req.swagger.params.scheduleExceptions.value;
	var tutorId = params.tutorId;
	var exceptions = params.exceptions;

	var fields = {
		date: 'date',
		duration: 'duration'
	};
	
	var errors = [];
	var fields_to_insert = {};

	// create a promise array to execute through
	var validations = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		validations.push(new Promise(function(resolve, reject) {

			// check for required and non required fields to validate accordingly.
			switch (content){
				case "date":
					fields_to_insert[content] = new Date();
					break;
				case "duration":
					fields_to_insert[fields[content]] = exceptions[content];
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

			scheduleModel.findOneAndUpdate(
			{
				account_id: tutorId
			},
			// set the old schedule as the new schedule
			// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
			{
				$push: {
					schedule_exceptions: fields_to_insert
				}
			},
			// this will return updated document rather than old one
			{ new : true },
			function(err, resultDocument) {

				console.log(resultDocument);
				if(err) {
					switch (err.name){
						case "CastError":
						case "MongoError":
							error.makeError(err.name, err.message)
							.then(function(error){
								reject(error);
							});
							break;
						default:
							error.makeMongooseError(err)
							.then(function(error){
								reject(error);
							});
							break;
					}
				} else if (!resultDocument){
					error.makeError("INVALID_ID", "ID does not exist.")
					.then(function(error){
						reject(error);
					});
				} else {
					resolve(resultDocument);
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
		error.sendError(err.name, err.message, res); 	
	});
};