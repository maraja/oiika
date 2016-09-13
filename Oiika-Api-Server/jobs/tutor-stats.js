const accountModel = app.models.accountModel;
const tutorModel = app.models.tutorModel;
const sessionModel = app.models.sessionModel;
const reviewModel = app.models.reviewModel;
const error = require('../api/helpers/errors');

const Promise = require('bluebird');
const moment = require('moment');
// const mongoose = require('mongoose');
const _ = require('underscore');
const CronJob = require('cron').CronJob;

module.exports = {

	calculateHoursWorked: () => {

		// let tutors = [];
		// let sessions = [];
		let tutorHours = [];
		let promises = [];

		// takes array to assign tutors to
		let getTutors = () => {
			return new Promise((resolve, reject) => {

				tutorModel.find({}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (resultDocument.length===0) {
						return error.errorHandler(null, "ERROR", "calculate hours worked get tutors job experienced an unexpected error.", reject, res);
					} else {
						// tutors = resultDocument;
						return resolve(resultDocument);
					}

				});

			});
		};

		let getSessionsAndReviews = tutors => {

			return new Promise((resolve, reject) => {

				let sessions = [];
				let reviews = [];

				let getSessions = () => {
					return new Promise((resolve, reject) => {

						sessionModel.find({}, (err, resultDocument) => {

							if(err) {
								return error.errorHandler(err, null, null, reject, res);
							} else if (resultDocument.length===0) {
								return error.errorHandler(null, "ERROR", "calculate hours worked get sessions job experienced an unexpected error.", reject, res);
							} else {
								sessions = resultDocument;
								return resolve(resultDocument);
							}

						});

					})

				};

				let getReviews = () => {
					return new Promise((resolve, reject) => {

						reviewModel.find({}, (err, resultDocument) => {

							if(err) {
								return error.errorHandler(err, null, null, reject, res);
							} else if (resultDocument.length===0) {
								return error.errorHandler(null, "ERROR", "calculate hours worked get reviews job experienced an unexpected error.", reject, res);
							} else {
								reviews = resultDocument;
								return resolve(resultDocument);
							}

						});

					})

				};

				getSessions()
				.then(getReviews)
				.then(() => {
					return resolve([tutors, sessions, reviews]);
				}).catch(err => { return error.sendError(err.name, err.message, res) && reject(); });
			});
		}

		let groupSessionsAndReviews = (tutors, sessions, reviews) => {
			return new Promise((resolve, reject) => {
				sessions = _.groupBy(sessions, 'tutor_id');
				reviews = _.groupBy(reviews, 'tutor_id');
				return resolve([tutors, sessions, reviews]);
			})
		}

		let acceptSessions = (tutors, sessions, reviews) => {

			let acceptedSessions = {};

			return new Promise((resolve, reject) => {
				_.each(sessions, (element, content) => {
					// console.log(element);
					// console.log(content);
					_.each(element, (session, index) => {
						if(moment().diff(session.date, 'hours') > 0){
							// if this number returns greater than 0, it means the session date has passed.
							if(!acceptedSessions[[content]]) acceptedSessions[[content]] = [];
							acceptedSessions[[content]].push(session);
						}
					})
				})
				return resolve([tutors, acceptedSessions, reviews]);
			})
		}

		let calculateStudentsTaught = (tutors, sessions, reviews) => {

			let students = {};

			return new Promise((resolve, reject) => {
				// console.log(sessions);
				_.each(sessions, (element, content) => {
					students = _.groupBy(element, 'tutee_id');
					// console.log(students);
					// console.log(Object.keys(students).length);
					sessions[content].push({
						students_taught: Object.keys(students).length
					});
					console.log(sessions[content]);
				})
				return resolve([tutors, sessions, reviews]);
			})

		}

		let display = (tutors, sessions, reviews) => {
			console.log(sessions);
		}


		getTutors()
		.then(getSessionsAndReviews)
		.spread(groupSessionsAndReviews)
		.spread(acceptSessions)
		.spread(calculateStudentsTaught)
		// handle success accordingly
		// .then(result => {
		// 	return res.send(JSON.stringify({
		// 		"message": "Successfully received",
		// 		"result": {
		// 			first_name: result.first_name,
		// 			last_name: result.last_name,
		// 			email: result.email,
		// 			skills: result.tutor.skills,
		// 			schedule: result.tutor.schedule,
		// 			schedule_exceptions: result.tutor.schedule_exceptions,
		// 			currentLocation: result.tutor.currentLocation,
		// 			// sessions: {
		// 			// 	tutor_id: result.sessions.tutor_id,
		// 			// 	tutee_id: result.sessions.tutee_id,
		// 			// 	subject_id: result.sessions.subject_id,
		// 			// 	hourly_rate: result.sessions.hourly_rate,
		// 			// 	date: result.sessions.date,
		// 			// 	timeslots: result.sessions.timeslots,
		// 			// }
		// 			sessions: result.sessions
		// 		}
		// 	}))
		// })
		// // catch all errors and handle accordingly
		// .catch(err => { return error.sendError(err.name, err.message, res); });

	},

	calculateStudentsTaught: () => {

	},

	calulateNumOfReviews: () => {

	}

}