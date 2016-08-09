
const scheduleModel = app.models.scheduleModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	getTutorScheduleByTutorId: getTutorScheduleByTutorId,
// 	updateSchedule: updateSchedule,
	createSchedule: createSchedule
};

// TODO: create schedule function
function createSchedule(tutorId, accountId){

	return new Promise(function(resolve, reject) {

		// create empty schedule for each tutor created
		scheduleModel.create({
			tutor_id: tutorId,
			account_id: accountId,
			schedule: {
				monday: -1,
				tuesday: -1,
				wednesday: -1,
				thursday: -1,
				friday: -1,
				saturday: -1,
				sunday: -1
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

function getTutorScheduleByTutorId(tutorId){
	return new Promise(function(resolve, reject) {

		scheduleModel.find(
		{
			tutor_id: tutorId
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

// TODO: get schedule function
// TODO: update schedule function