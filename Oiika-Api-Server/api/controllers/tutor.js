
const accountModel = app.models.accountModel;
const tutorModel = app.models.tutorModel;
const sessionModel = app.models.sessionModel;
const subjectModel = app.models.subjectModel;
const skillModel = app.models.skillModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const tutorStats = require('../../jobs/tutor-stats.js')

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

		let findTutorSubjects = account => {
			return new Promise((resolve, reject) => {

				subjectModel.find({
					_id: { $in: account.tutor.subjects }
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else {
						account["subjects"] = resultDocument; 
						return resolve(account);
					}

				});

			});
		};

		let findTutorSkills = account => {
			return new Promise((resolve, reject) => {

				skillModel.find({
					_id: { $in: account.tutor.skills }
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else {
						account["skills"] = resultDocument; 
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
		.then(findTutorSubjects)
		.then(findTutorSkills)
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
					schedule: result.tutor.schedule,
					schedule_exceptions: result.tutor.schedule_exceptions,
					currentLocation: result.tutor.currentLocation,
					// dummy values for now:
					hours_worked: result.tutor.hours_worked,
					students_taught: result.tutor.students_taught,
					num_of_reviews: result.tutor.num_of_reviews,
					rating: result.tutor.rating,
					// sessions: {
					// 	tutor_id: result.sessions.tutor_id,
					// 	tutee_id: result.sessions.tutee_id,
					// 	subject_id: result.sessions.subject_id,
					// 	hourly_rate: result.sessions.hourly_rate,
					// 	date: result.sessions.date,
					// 	timeslots: result.sessions.timeslots,
					// }
					skills: result.skills,
					sessions: result.sessions,
					subjects: result.subjects
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
	},

	// endpoint created for now
	updateTutorStats: (req, res) => {

		tutorStats.calculateTutorStats()
		// handle success accordingly
		.then(() => {
			return res.send(JSON.stringify({
				"message": "Successfully updated",
				"result": "All Tutor stats updated perfectly at " + (new Date())
			}))
		})
		// catch all errors and handle accordingly
		.catch(err => { 
			return res.send(JSON.stringify({
				"message": "Error",
				"result": err
			}))
		});

	}

};