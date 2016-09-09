
const accountModel = app.models.accountModel;
const tutorModel = app.models.tutorModel;
const sessionModel = app.models.sessionModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {

	// GET REQUESTS
	getTutorByAccountId: (req, res) => {
		let tutorId = req.swagger.params.tutorId.value;

		let findAccount = () => {
			return new Promise((resolve, reject) => {

				accountModel.findOne({
					_id: tutorId,
					user_type: 'tutor'
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, res);
					} else {
						return resolve(resultDocument);
					}

				});

			});
		}

		let findTutor = account => {
			return new Promise((resolve, reject) => {

				tutorModel.findOne({
					tutor_id: tutorId
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, res);
					} else {
						account["tutor"] = resultDocument;
						return resolve(account);
					}

				});

			});
			
		};

		let findTutorSessions = account => {
			return new Promise((resolve, reject) => {

				sessionModel.find({
					tutor_id: account.tutor.tutor_id
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else {
						account["sessions"] = resultDocument; 
						return resolve(account);
					}

				});

			});
		};

		// begin promise chain
		// start by finding the tutor
		findAccount()
		.then(findTutor)
		.then(findTutorSessions)
		// handle success accordingly
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully received",
				"result": {
					first_name: result.first_name,
					last_name: result.last_name,
					email: result.email,
					profile_picture: result.profile_picture,
					cover_photo: result.tutor.cover_photo,
					// rating: result.tutor.rating,
					hourly_rate: result.tutor.hourly_rate,
					skills: result.tutor.skills,
					schedule: result.tutor.schedule,
					schedule_exceptions: result.tutor.schedule_exceptions,
					currentLocation: result.tutor.currentLocation,
					// dummy values for now:
					hours_worked: 17,
					num_of_students: 6,
					num_of_reviews: 9,
					rating: 3.79,
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
		.catch(err => { return error.sendError(err.name, err.message, res); });
	},

	// PUT REQUESTS
	updateTutorLocation: (req, res) => {
		let location = req.swagger.params.location.value;

		let updateLocation = () => {
			return new Promise((resolve, reject) => {
				tutorModel.findOneAndUpdate(
				{
					tutor_id: location.tutorId
				},
				// set the old schedule as the new schedule
				// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
				{
					$set: {
						currentLocation: {
							city: location.city,
							lat : location.location.lat,
							lng : location.location.lng
						}
					}
				},
				// this will return updated document rather than old one
				{ 
					new : true,
					runValidators : true
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, res);
					} else {
						return resolve(resultDocument.currentLocation);
					}

				});
			})
		}

		// begin promise chain
		updateLocation()
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully updated",
				"result": result
			}));
		}).catch(err => { return error.sendError(err.name, err.message, res); });
	}

};