
const tutorModel = app.models.tutorModel;
const sessionModel = app.models.sessionModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const schedules = require('./schedules');
const reviews = require('./reviews');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	getTutorByAccountId: getTutorByAccountId,
	getTutorReviewsByAccountId: getTutorReviewsByAccountId,
	getTutorScheduleByAccountId: getTutorScheduleByAccountId,
	updateTutorSchedule: updateTutorSchedule,
	updateTutorLocation: updateTutorLocation
};

// POST REQUESTS


// GET REQUESTS
function getTutorByAccountId(req, res) {
	// NOTE: when this route is run, it'll only return data from the TUTOR collection,
	// which means it won't include basic information such as first_name, last_name and email.
	// please store this information in the express/redis session upon login!
	var tutorId = req.swagger.params.tutorId.value;

	var findTutor = function(){
		return new Promise(function(resolve, reject) {

			tutorModel.findOne({
				tutor_id: tutorId
			}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, res);
				} else if (!resultDocument) {
					return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, res);
				} else {
					return resolve(resultDocument);
				}

			});

		});
		
	};

	var findTutorSessions = function(tutor){
		return new Promise(function(resolve, reject) {

			sessionModel.find({
				tutor_id: tutor.tutor_id
			}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, reject, res);
				} else {
					tutor["sessions"] = resultDocument; 
					return resolve(tutor);
				}

			});

		});
	};

	// begin promise chain
	// start by finding the tutor
	findTutor()
	.then(findTutorSessions)
	// handle success accordingly
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Successfully received",
			"result": {
				skills: result.skills,
				schedule: result.schedule,
				schedule_exceptions: result.schedule_exceptions,
				currentLocation: result.currentLocation,
				// sessions: {
				// 	tutor_id: result.sessions.tutor_id,
				// 	tutee_id: result.sessions.tutee_id,
				// 	subject_id: result.sessions.subject_id,
				// 	hourly_rate: result.sessions.hourly_rate,
				// 	date: result.sessions.date,
				// 	timeslots: result.sessions.timeslots,
				// }
				sessions: result.sessions
			}
		}))
	})
	// catch all errors and handle accordingly
	.catch(function(err){
		return error.sendError(err.name, err.message, res); 	
	});
};

function getTutorReviewsByAccountId(req, res){
	var tutorId = req.swagger.params.tutorId.value;

	// begin promise chain
	reviews.getTutorReviewsByAccountId(tutorId)
	.then(function(result){
		return res.send(JSON.stringify(result));
	}).catch(function(err){
		error.sendError(err.name, err.message, res);
	});
};

function getTutorScheduleByAccountId(req, res){
	var tutorId = req.swagger.params.tutorId.value;

	schedules.getTutorScheduleByAccountId(tutorId)
	// send resulting schedule for tutor
	.then(function(resultDocument){
		res.send(resultDocument);
	// catch error and display accordingly.
	}).catch(function(err){
		error.sendError(err.name, err.message, res);
	});
};


// PUT REQUESTS
function updateTutorSchedule(req, res){
	var schedule = req.swagger.params.schedule.value;

	// begin promise chain
	schedules.updateSchedule(schedule)
	.then(function(result){
		return res.send(JSON.stringify({
			"message": "Successfully updated",
			"result": result
		}))
	}).catch(function(err){
		return error.sendError(err.name, err.message, res);
	});
};

function updateTutorLocation(req, res){
	var location = req.swagger.params.location.value;

	tutorModel.findOneAndUpdate(
	{
		tutor_id: location.tutorId
	},
	// set the old schedule as the new schedule
	// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
	{
		$set: {
			currentLocation: {
				lat : location.location.lat,
				lng : location.location.lng
			}
		}
	},
	// this will return updated document rather than old one
	{ 
		new : true,
		runValidators : true
	},
	function(err, resultDocument) {

		if(err) {
			return error.errorHandler(err, null, null, null, res);
		} else if (!resultDocument) {
			return error.errorHandler(null, "INVALID_ID", "ID does not exist.", null, res);
		} else {
			return res.send(JSON.stringify({
				"message": "Successfully updated",
				"result": resultDocument.currentLocation
			}));
		}

	});
};