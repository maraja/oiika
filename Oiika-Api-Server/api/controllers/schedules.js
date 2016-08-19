
const scheduleModel = app.models.scheduleModel;
const tutorModel = app.models.tutorModel;
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

// DEPRECATED
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
				return error.errorHandler(err, null, null, reject, null);
			}
			else {
				return resolve(result);
			}

		});

	});
};

function getTutorScheduleByAccountId(tutorId){
	return new Promise(function(resolve, reject) {

		tutorModel.findOne(
		{
			tutor_id: tutorId
		},
		{
			schedule: 1,
			_id: 0
		}, function(err, resultDocument) {

			if(err) {
				return error.errorHandler(err, null, null, reject, null);
			} else if (!resultDocument) {
				return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
			} else {
				return resolve(resultDocument.schedule);
			}

		});

	});
};

// update schedule by account id
function updateSchedule(schedule){

	return new Promise(function(resolve, reject) {

		tutorModel.findOneAndUpdate(
		{
			tutor_id: schedule.tutorId
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
				return error.errorHandler(err, null, null, reject, null);
			} else if (!resultDocument) {
				return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
			} else {
				return resolve(resultDocument.schedule);
			}

		});

	});
};

function updateScheduleExceptions(req, res){

	var exceptions = req.swagger.params.scheduleExceptions.value;
	console.log(exceptions);
	var tutorId = exceptions.tutorId;

	// var fields = {
	// 	date: 'date',
	// 	duration: 'duration'
	// };
	
	var fields_to_insert = {};

	// create a promise array to execute through
	var map = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(exceptions, function(element, content){

		map.push(new Promise(function(resolve, reject) {

			// check for required and non required fields to validate accordingly.
			switch (content){
				case "tutorId":
					break;
				default:
					fields_to_insert[content] = exceptions[content];
					break;
			}

			return resolve();

		})

	)});

	// create a promise variable to insert into the database.
	var insertToDb = function(){
		return new Promise(function(resolve, reject) {

			scheduleModel.findOneAndUpdate(
			{
				tutor_id: tutorId
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

				if(err) {
					return error.errorHandler(err, null, null, reject, null);
				} else if (!resultDocument) {
					return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
				} else {
					return resolve(resultDocument.schedule_exceptions);
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