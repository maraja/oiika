const accountModel = app.models.accountModel;
const tutorModel = app.models.tutorModel;
const sessionModel = app.models.sessionModel;
const reviewModel = app.models.reviewModel;
const error = require('../api/helpers/errors');

const Promise = require('bluebird');
const moment = require('moment');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	calculateTutorStats: () => {

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
						if(moment().diff(session.date, 'hours') > 0 && session.state === 'accepted'){
							// if this number returns greater than 0, it means the session date has passed.
							if(!acceptedSessions[[content]]) acceptedSessions[[content]] = [];
							acceptedSessions[[content]].push(session);
						}
					})
				})
				return resolve([tutors, acceptedSessions, reviews]);
			})
		}

		let calculateStudentsTaughtAndHoursWorked = (tutors, sessions, reviews) => {

			// create blank variables to hold temp variables to perform calculations on 
			let students = {};
			let hoursWorked = 0;

			return new Promise((resolve, reject) => {
				// console.log(sessions);
				// loop through each tutor's list of sessions.
				_.each(sessions, (element, content) => {
					// loop through each session for a tutor and calculate
					// the amount of hours they've worked concatenating it
					// into the temp variable created.
					_.each(element, (session, index) => {
						hoursWorked += session.timeslots.length;
					})
					// divide the hours worked by 2 because timeslots are on a half an hour basis.
					hoursWorked = hoursWorked/2;
					// group all sessions by tutees to calculate the amount of tutees tutored.
					students = _.groupBy(element, 'tutee_id');
					// push all this to a new object at the end of the array.
					sessions[content].push({
						students_taught: Object.keys(students).length,
						hours_worked: hoursWorked
					});
					// reset hoursWorked variable for next tutor to iterate through
					hoursWorked = 0;
					// display the last field in each array (tutor)
					//console.log(sessions[content][sessions[content].length-1]);
				})
				// console.log(sessions);
				return resolve([tutors, sessions, reviews]);
			})

		}

		let calculateNumberOfReviews = (tutors, sessions, reviews) => {

			let numOfReviews = 0;
			let rating = 0;

			return new Promise((resolve, reject) => {
				// loop through each tutor's list of reviews.
				_.each(reviews, (element, content) => {
					// get number of reviews
					numOfReviews = element.length;
					// aggregate ratings
					_.each(element, (review, index) => {
						rating += review.rating;
					})
					// calculate average rating
					rating = rating/numOfReviews;
					// push all this to a new object at the end of the array.
					reviews[content].push({
						num_of_reviews: numOfReviews,
						rating: rating
					});
					
					rating = 0;
					numOfReviews = 0;
					// display the last field in each array (tutor)
					//console.log(reviews[content][reviews[content].length-1]);
				})
				return resolve([tutors, sessions, reviews]);
			})

		}

		let postToDb = (tutors, sessions, reviews) => {

			var promises = [];

			//console.log(sessions);

			_.each(tutors, (element, content) => {

				// create object based on criteria to post to database
				let insertObj = {}

				// get all the objects at the end of each tutor's sessions and reviews we created earlier and post to db.
				if (sessions[element.tutor_id]){ 
					// get last object in array
					insertObj["students_taught"] = sessions[element.tutor_id][sessions[element.tutor_id].length-1].students_taught;
					insertObj["hours_worked"] = sessions[element.tutor_id][sessions[element.tutor_id].length-1].hours_worked;
				}
				if (reviews[element.tutor_id]){
					// get last object in array
					insertObj["num_of_reviews"] = reviews[element.tutor_id][reviews[element.tutor_id].length-1].num_of_reviews;
					insertObj["rating"] = reviews[element.tutor_id][reviews[element.tutor_id].length-1].rating;
				}

				if (sessions[element.tutor_id] || reviews[element.tutor_id]){

					promises.push(new Promise((resolve, reject) => {

						tutorModel.findOneAndUpdate(
						{
							tutor_id: element.tutor_id
						},
						// set the old schedule as the new schedule
						// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
						{
							$set: insertObj
						},
						// this will return updated document rather than old one
						{ 
							new : true,
							runValidators : true
						},
						(err, resultDocument) => {

							if(err) {
								return error.errorHandler(err, null, null, reject, null);
							} else if (!resultDocument) {
								return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
							} else {
								//console.log(resultDocument);
								return resolve(resultDocument);
							}

						});
						// return resolve([tutors, sessions, reviews]);
					}))

				}

			})

			return new Promise((resolve, reject) => {

				Promise.all(promises)
				.then(() => { return resolve(); })
				.catch(err => { return reject(err); });

			})

		}

		let display = (tutors, sessions, reviews) => {
			//console.log(tutors);
		}

		return new Promise((resolve, reject) => {

			getTutors()
			.then(getSessionsAndReviews)
			.spread(groupSessionsAndReviews)
			.spread(acceptSessions)
			.spread(calculateStudentsTaughtAndHoursWorked)
			.spread(calculateNumberOfReviews)
			.spread(postToDb)
			// handle success accordingly
			.then(() => {
				console.log("All Tutor stats updated perfectly at " + (new Date()));
				return resolve();
			})
			// catch all errors and handle accordingly
			.catch(err => { console.log("Tutor Stats error"); error.printError(err); return reject(); });

		})
	}

}