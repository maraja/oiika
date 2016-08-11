
const scheduleModel = app.models.scheduleModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');


const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	getTutorScheduleByAccountId: getTutorScheduleByAccountId,
	updateSchedule: updateSchedule,
	createBlankSchedule: createBlankSchedule
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
			account_id: schedule.accountId
		},
		// set the old schedule as the new schedule
		// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
		{
			$set: {
				schedule: schedule.schedule
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

	});
};