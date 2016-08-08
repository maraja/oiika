
const scheduleModel = app.models.scheduleModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
// 	getScheduleById: getScheduleById,
// 	updateSchedule: updateSchedule,
	createSchedule: createSchedule
};

// TODO: create schedule function
function createSchedule(tutorId, accountId){

	return new Promise(function(resolve, reject) {

		var fields_to_insert = {
			tutor_id: tutorId,
			account_id: accountId,
			schedule: {
				monday: null,
				tuesday: null,
				wednesday: null,
				thursday: null,
				friday: null,
				saturday: null,
				sunday: null
	      	}
		};

		scheduleModel.create(fields_to_insert, function(err, result) {

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
}

// TODO: get schedule function
// TODO: update schedule function