
const sessionModel = app.models.sessionModel;
const tutorModel = app.models.tutorModel;
const tuteeModel = app.models.tuteeModel;
const subjectModel = app.models.subjectModel;

// let ObjectId = require('mongodb').ObjectId;

const valid = require('../helpers/validations');
const error = require('../helpers/errors');
const validator = require('../helpers/validators');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');
const moment = require('moment');

const acceptTime = 1; 		// time in hours before the first timeslot a tutee can accept
const rejectTime = 1; 		// time in hours before the first timeslot a tutee can reject
const completeTime = 0.5; // time in hours after the last timeslot a tutee can complete
const cancelTime = 24; 		// time in hours before the first timeslot a tutee can cancel

module.exports = {

	getSessionsByAccountId: (req, res) => {
		let params = req.swagger.params;
		let accountId = params.accountId.value;

		let getSessions = () => {
			return new Promise((resolve, reject) => {
				sessionModel.find(
				{
					$or: [
						{ tutee_id: accountId },
						{ tutor_id: accountId }
					]
				},
				// {
				// 	_id: 0
				// }, 
				(err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (resultDocument.length===0) {
						return error.errorHandler(null, "NO_SESSIONS", "No sessions exist for the entered user.", reject, null);
					} else {
						return resolve(resultDocument);
					}

				});
			});
		};

		getSessions()
		.then(sessions => {
			return res.send(JSON.stringify(sessions))
		}).catch(err => {
			return error.sendError(err.name, err.message, res); 
		});
	},

	getAcceptedSessionsByAccountId: (req, res) => {
		let params = req.swagger.params;
		let accountId = params.accountId.value;

		let getSessions = () => {
			return new Promise((resolve, reject) => {
				sessionModel.find(
				{
					$and: [
						{
							$or: [
								{ tutee_id: accountId },
								{ tutor_id: accountId }
							]
						},
						{
							state: 'accepted'
						}
					]
				},
				// {
				// 	_id: 0
				// }, 
				(err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (resultDocument.length===0) {
						return error.errorHandler(null, "NO_SESSIONS", "No sessions exist with the entered criteria", reject, null);
					} else {
						return resolve(resultDocument);
					}

				});
			});
		};

		getSessions()
		.then(sessions => {
			return res.send(JSON.stringify(sessions))
		}).catch(err => {
			return error.sendError(err.name, err.message, res); 
		});
	},

	getRejectedSessionsByAccountId: (req, res) => {
		let params = req.swagger.params;
		let accountId = params.accountId.value;

		let getSessions = () => {
			return new Promise((resolve, reject) => {
				sessionModel.find(
				{
					$and: [
						{
							$or: [
								{ tutee_id: accountId },
								{ tutor_id: accountId }
							]
						},
						{
							state: 'rejected'
						}
					]
				},
				// {
				// 	_id: 0
				// }, 
				(err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (resultDocument.length===0) {
						return error.errorHandler(null, "NO_SESSIONS", "No sessions exist with the entered criteria", reject, null);
					} else {
						return resolve(resultDocument);
					}

				});
			});
		};

		getSessions()
		.then(sessions => {
			return res.send(JSON.stringify(sessions))
		}).catch(err => {
			return error.sendError(err.name, err.message, res); 
		});
	},

	getPendingSessionsByAccountId: (req, res) => {
		let params = req.swagger.params;
		let accountId = params.accountId.value;

		let getSessions = () => {
			return new Promise((resolve, reject) => {
				sessionModel.find(
				{
					$and: [
						{
							$or: [
								{ tutee_id: accountId },
								{ tutor_id: accountId }
							]
						},
						{
							state: 'pending'
						}
					]
				},
				// {
				// 	_id: 0
				// }, 
				(err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (resultDocument.length===0) {
						return error.errorHandler(null, "NO_SESSIONS", "No sessions exist with the entered criteria", reject, null);
					} else {
						return resolve(resultDocument);
					}

				});
			});
		};

		getSessions()
		.then(sessions => {
			return res.send(JSON.stringify(sessions))
		}).catch(err => {
			return error.sendError(err.name, err.message, res); 
		});
	},

	getCompletedSessionsByAccountId: (req, res) => {
		let params = req.swagger.params;
		let accountId = params.accountId.value;

		let getSessions = () => {
			return new Promise((resolve, reject) => {
				sessionModel.find(
				{
					$and: [
						{
							$or: [
								{ tutee_id: accountId },
								{ tutor_id: accountId }
							]
						},
						{
							state: 'completed'
						}
					]
				},
				// {
				// 	_id: 0
				// }, 
				(err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (resultDocument.length===0) {
						return error.errorHandler(null, "NO_SESSIONS", "No sessions exist with the entered criteria", reject, null);
					} else {
						return resolve(resultDocument);
					}

				});
			});
		};

		getSessions()
		.then(sessions => {
			return res.send(JSON.stringify(sessions))
		}).catch(err => {
			return error.sendError(err.name, err.message, res); 
		});
	},

	getCancelledSessionsByAccountId: (req, res) => {
		let params = req.swagger.params;
		let accountId = params.accountId.value;

		let getSessions = () => {
			return new Promise((resolve, reject) => {
				sessionModel.find(
				{
					$and: [
						{
							$or: [
								{ tutee_id: accountId },
								{ tutor_id: accountId }
							]
						},
						{
							state: 'cancelled'
						}
					]
				},
				// {
				// 	_id: 0
				// }, 
				(err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (resultDocument.length===0) {
						return error.errorHandler(null, "NO_SESSIONS", "No sessions exist with the entered criteria", reject, null);
					} else {
						return resolve(resultDocument);
					}

				});
			});
		};

		getSessions()
		.then(sessions => {
			return res.send(JSON.stringify(sessions))
		}).catch(err => {
			return error.sendError(err.name, err.message, res); 
		});
	},

	createSession: (req, res) => {

		let session = req.swagger.params.session.value;

		let fields = {
			tutorId: 'tutor_id',
			tuteeId: 'tutee_id',
			subjectId: 'subject_id',
			hourly_rate: 'hourly_rate',
			date: 'date',
			timeslots: 'timeslots'
		};
		
		let fields_to_insert = {};
		fields_to_insert['state'] = 'pending';

		// create a promise array to execute through
		let map = [];

		// populate promise array with new promises returning resolved after validating fields and assigning
		// them into the fields_to_insert object.
		_.each(fields, function(element, content){

			map.push(new Promise(function(resolve, reject) {

				fields_to_insert[fields[content]] = session[content];
				return resolve();

			})

		)});

		// must be done here before it's used to compare against schedule and other timeslots for efficiency.
		let validateTimeslots = () => {

			let isValid = true;
			let promises = [];

			_.each(session.timeslots, function(element, content){

				promises.push(new Promise((resolve, reject) => {

					isValid = (validator.time(element) && isValid ? true : false );

					return resolve();

				}))
			});

			return new Promise((resolve, reject) => {
				Promise.all(promises)
				.then(() =>{
					if(isValid) {
						return resolve();
					} else {
						return error.errorHandler(null, "INVALID_TIMESLOTS", "Invalid values for timeslots entered.", reject, res);
					}
				});
			});
			
		};

		// check to see if tutor exsists
		let checkTutor = () => {
			return new Promise((resolve, reject) => {

				tutorModel.findOne({
					tutor_id: session.tutorId
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "Tutor does not exist.", reject, res);
					} else {
						return resolve(resultDocument);
					}

				});

			});
		};

		// get all the tutor sessions for future checking
		let getSessions = tutor => {
			return new Promise((resolve, reject) => {

				sessionModel.find({
					tutor_id: tutor.tutor_id
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else {
						tutor["sessions"] = resultDocument; 
						return resolve(tutor);
					}

				});

			});
		}

		// check all schedule and schedule exceptions logic to ensure no conflicts
		let checkScheduleConflicts = tutor => {

			let getDay = () => {
				return new Promise((resolve, reject) => {

					// moment ref: http://stackoverflow.com/questions/7445328/check-if-a-string-is-a-date-value
					if (moment(session.date, moment.ISO_8601, true).isValid()){
						// valid date, continue
						session.date = new Date(session.date);
						return resolve(session.date.getDay())
					} else {
						return error.errorHandler(null, "INVALID_DATE", "Invalid date entered.", reject, res);
					}

				});
			};

			let checkSchedule = day => {
				return new Promise((resolve, reject) => {

					console.log(_.difference(session.timeslots, tutor.schedule[day]));
					// this logic checks the size of the output array compared to the given timeslots array
					// difference() will output an array with the differences between the two arrays
					if(_.difference(session.timeslots, tutor.schedule[day]).length === 0){
						return resolve();
					} else {
						return error.errorHandler(null, "INVALID_TIMESLOTS", "Entered timeslots are not a part of tutor's schedule.", reject, res);
						// for testing
						// return resolve();
					}

				});
			};

			let checkExceptions = () => {

				let exceptions = [];

				// throw all exception date comparisons into a promise array to evaluate later.
				_.each(tutor.schedule_exceptions, (exception) => {
					exceptions.push(new Promise((resolve, reject) => {

						// convert exception date to a date object for comparison
						exception.date = new Date(exception.date);
						// go through exception array and check to see if dates match entered date one by one
						// if match exists, check timeslots.
						if(moment(session.date).isSame(exception.date, 'day')){
							//conflict may exist
							// check timeslots against exception timeslots along with the all day flag
							if(_.difference(session.timeslots, exception.timeslots).length === session.timeslots.length && !exception.all_day){
								return resolve();
							} else {
								return error.errorHandler(null, "INVALID_TIMESLOTS", "Entered timeslots have been booked off by tutor.", reject, res);
								// for testing
								// return resolve();
							}
						} else {
							// no conflicts
							return resolve();
						}

					}));
				});

				return new Promise((resolve, reject) => {
					Promise.all(exceptions)
					.then(() => { return resolve(); })
					.catch(err => { return reject(err); })
				})
				
			};

			let checkSessions = () => {

				let sessions = [];

				// throw all exception date comparisons into a promise array to evaluate later.
				_.each(tutor.sessions, (tempSession) => {
					sessions.push(new Promise((resolve, reject) => {

						// convert exception date to a date object for comparison
						tempSession.date = new Date(tempSession.date);
						// go through exception array and check to see if dates match entered date one by one
						// if match exists, check timeslots.
						if(moment(session.date).isSame(tempSession.date, 'day')){
							//conflict may exist
							if(_.difference(session.timeslots, tempSession.timeslots).length === session.timeslots.length){
								return resolve();
							} else {
								return error.errorHandler(null, "INVALID_TIMESLOTS", "Entered timeslots have been booked already.", reject, res);
								// for testing
								// return resolve();
							}
						} else {
							// no conflicts
							return resolve();
						}

					}));
				});

				return new Promise((resolve, reject) => {
					Promise.all(sessions)
					.then(() => { return resolve(); })
					.catch(err => { return reject(err); })
				})
				
			};

			return new Promise((resolve, reject) => {
				getDay()
				.then(checkSchedule)
				.then(checkExceptions)
				.then(checkSessions)
				.then(() => { return resolve(); })
				.catch(err => { return reject(err); })
			})
		};

		// check to see if tutee exists from given id
		let checkTutee = () => {
			return new Promise((resolve, reject) => {

				tuteeModel.findOne({
					tutee_id: session.tuteeId
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "Tutee does not exist.", reject, res);
					} else {
						return resolve();
					}

				});

			});
		};

		// check to see if subject exists and get the id for it
		let checkSubject = () => {
			return new Promise((resolve, reject) => {

				session.subjectName = new RegExp(".*" + session.subjectName + ".*", "gi");

				subjectModel.findOne({ 
					$and : [
						{ name: session.subjectName } , //(subject.name+' = (this.name)') },
						{ level: session.subjectLevel }  //(subject.level+' = (this.level)') }
					]
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_SUBJECT", "Entered subject does not exist.", reject, res);
					} else {
						// throw subject id into fields_to_insert object for display later
						fields_to_insert['subject_id'] = resultDocument._id;
						return resolve();
					}
				});

			});
		};

		// create a promise variable to insert into the database.
		let insertToDb = () => {
			return new Promise((resolve, reject) => {

				sessionModel.create(fields_to_insert, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else {
						return resolve(resultDocument);
					}

				});

			});
		};


		// begin promise chain looping through promise array.
		Promise.all(map)
		.then(validateTimeslots)
		.then(checkTutor)
		.then(getSessions)
		.then(checkScheduleConflicts)
		.then(checkTutee)
		.then(checkSubject)
		.then(insertToDb)
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully created",
				"result": result
			}))
		})
		.catch(err => {
			return error.sendError(err.name, err.message, res); 	
		});
	},

	acceptSession: (req, res) => {

		let session = req.swagger.params.session.value;

		let updateSession = () => {
			return new Promise((resolve, reject) => {

				sessionModel.findOne(
				{
					_id: session.sessionId,
					tutor_id: session.tutorId
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
					} else {

						if (resultDocument.timeslots && resultDocument.timeslots.length!==0) {

							if (resultDocument.state==='pending') {

								var sessionDate = new moment(resultDocument.date);
								var acceptDate = new moment().add(acceptTime, 'hours');

								var sessionTime = "23:59:59";

								_.each(resultDocument.timeslots, function(timeslot) {
									if (timeslot.split(':')[0] <= sessionTime.split(':')[0] 
									 && timeslot.split(':')[1] <= sessionTime.split(':')[1]) {

									 	if (timeslot.split(':').length > 2) {

											if (sessionTime.split(':').length > 2 && timeslot.split(':')[2] <= sessionTime.split(':')[2]) {
												sessionTime = timeslot;
											}

										} else {
											sessionTime = timeslot;
										}

									} 
								});

								sessionDate.hour(sessionTime.split(':')[0]);
								sessionDate.minute(sessionTime.split(':')[1]);

								if (sessionTime.split(':').length > 2) {
									sessionDate.second(sessionTime.split(':')[2]);
								} else {
									sessionDate.second(0);
								}

								if (acceptDate.isBefore(sessionDate)) {
									resultDocument.state = 'accepted';
									resultDocument.save();

									return resolve(resultDocument);
								} else {
									return error.errorHandler(null, "NOT_ACCEPTABLE", "Session cannot be accepted as it is too close to the session's start date/time", reject, null);
								}

							} else {
								return error.errorHandler(null, "NOT_ACCEPTABLE", "Session cannot be accepted as it is not currently pending", reject, null);
							}

						} else {
							return error.errorHandler(null, "NO_TIMESLOTS", "Session doesn't have any timeslots", reject, null);
						}	

					}

				});

			});
		};

		// begin promise chain
		updateSession()
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully updated",
				"result": result
			}))
		}).catch(err => { return error.sendError(err.name, err.message, res); });
	},

	rejectSession: (req, res) => {

		let session = req.swagger.params.session.value;

		let updateSession = () => {
			return new Promise((resolve, reject) => {

				sessionModel.findOne(
				{
					_id: session.sessionId,
					tutor_id: session.tutorId
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
					} else {

						if (resultDocument.timeslots && resultDocument.timeslots.length!==0) {

							if (resultDocument.state!=='accepted') {

								if (resultDocument.state==='pending') {

									var sessionDate = new moment(resultDocument.date);
									var rejectDate = new moment().add(rejectTime, 'hours');

									var sessionTime = "23:59:59";

									_.each(resultDocument.timeslots, function(timeslot) {
										if (timeslot.split(':')[0] <= sessionTime.split(':')[0] 
										 && timeslot.split(':')[1] <= sessionTime.split(':')[1]) {

										 	if (timeslot.split(':').length > 2) {

												if (sessionTime.split(':').length > 2 && timeslot.split(':')[2] <= sessionTime.split(':')[2]) {
													sessionTime = timeslot;
												}

											} else {
												sessionTime = timeslot;
											}

										} 
									});

									sessionDate.hour(sessionTime.split(':')[0]);
									sessionDate.minute(sessionTime.split(':')[1]);

									if (sessionTime.split(':').length > 2) {
										sessionDate.second(sessionTime.split(':')[2]);
									} else {
										sessionDate.second(0);
									}

									if (rejectDate.isBefore(sessionDate)) {
										resultDocument.state = 'rejected';
										resultDocument.save();

										return resolve(resultDocument);
									} else {
										return error.errorHandler(null, "NOT_REJECTABLE", "Session cannot be rejected as it is too close to the session's start date/time", reject, null);
									}

								} else {
									return error.errorHandler(null, "NOT_REJECTABLE", "Session cannot be accepted as it is not currently pending", reject, null);
								}

							} else {
								return error.errorHandler(null, "NOT_REJECTABLE", "Session cannot be rejected as it has already been accepted.", reject, null);
							}

						} else {
							return error.errorHandler(null, "NO_TIMESLOTS", "Session doesn't have any timeslots", reject, null);
						}									

					}

				});

			});
		};

		// begin promise chain
		updateSession()
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully updated",
				"result": result
			}))
		}).catch(err => { return error.sendError(err.name, err.message, res); });
	},

	completeSession: (req, res) => {

		let session = req.swagger.params.session.value;

		let updateSession = () => {
			return new Promise((resolve, reject) => {

				sessionModel.findOne(
				{
					_id: session.sessionId,
					tutor_id: session.tutorId
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
					} else {

						if (resultDocument.timeslots && resultDocument.timeslots.length!==0) {
							
							if (resultDocument.state==='accepted') {

								var sessionDate = new moment(resultDocument.date);
								var completeDate = new moment().subtract(completeTime, 'hours');

								var sessionTime = "00:00:00";

								_.each(resultDocument.timeslots, function(timeslot) {
									if (timeslot.split(':')[0] >= sessionTime.split(':')[0] 
									 && timeslot.split(':')[1] >= sessionTime.split(':')[1]) {

									 	if (timeslot.split(':').length > 2) {

											if (sessionTime.split(':').length < 3 || timeslot.split(':')[2] >= sessionTime.split(':')[2]) {
												sessionTime = timeslot;
											}

										} else {
											sessionTime = timeslot;
										}

									} 
								});								

								sessionDate.hour(sessionTime.split(':')[0]);
								sessionDate.minute(sessionTime.split(':')[1]);

								if (sessionTime.split(':').length > 2) {
									sessionDate.second(sessionTime.split(':')[2]);
								} else {
									sessionDate.second(0);
								}

								if (completeDate.isAfter(sessionDate)) {
									resultDocument.state = 'completed';
									resultDocument.save();

									return resolve(resultDocument);
								} else {
									return error.errorHandler(null, "NOT_COMPLETABLE", "Session cannot be completed as it is too close to the session's end date/time", reject, null);
								}
								
							} else {
								return error.errorHandler(null, "NOT_COMPLETABLE", "Session cannot be completed if it was not accepted", reject, null);
							}

						} else {
							return error.errorHandler(null, "NO_TIMESLOTS", "Session doesn't have any timeslots", reject, null);
						}		
			
					}

				});

			});
		};

		// begin promise chain
		updateSession()
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully updated",
				"result": result
			}))
		}).catch(err => { return error.sendError(err.name, err.message, res); });
	},

	cancelSession: (req, res) => {

		let session = req.swagger.params.session.value;

		let updateSession = () => {
			return new Promise((resolve, reject) => {

				sessionModel.findOne(
				{
					_id: session.sessionId,
					tutor_id: session.tutorId
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
					} else {
						if (resultDocument.timeslots && resultDocument.timeslots.length!==0) {

							if (resultDocument.state==='accepted') {

								var sessionDate = new moment(resultDocument.date);
								var cancelDate = new moment().add(cancelTime, 'hours');

								var sessionTime = "23:59:59";

								_.each(resultDocument.timeslots, function(timeslot) {
									if (timeslot.split(':')[0] <= sessionTime.split(':')[0] 
									 && timeslot.split(':')[1] <= sessionTime.split(':')[1]) {

									 	if (timeslot.split(':').length > 2) {

											if (sessionTime.split(':').length > 2 && timeslot.split(':')[2] <= sessionTime.split(':')[2]) {
												sessionTime = timeslot;
											}

										} else {
											sessionTime = timeslot;
										}

									} 
								});

								sessionDate.hour(sessionTime.split(':')[0]);
								sessionDate.minute(sessionTime.split(':')[1]);

								if (sessionTime.split(':').length > 2) {
									sessionDate.second(sessionTime.split(':')[2]);
								} else {
									sessionDate.second(0);
								}

								if (cancelDate.isBefore(sessionDate)) {
									resultDocument.state = 'cancelled';
									resultDocument.save();

									return resolve(resultDocument);
								} else {
									return error.errorHandler(null, "NOT_CANCELLABLE", "Session cannot be cancelled as it is too close to the session's start date/time", reject, null);
								}

							} else {
								return error.errorHandler(null, "NOT_CANCELLABLE", "Session cannot be completed if it was not accepted", reject, null);
							}

						} else {
							return error.errorHandler(null, "NO_TIMESLOTS", "Session doesn't have any timeslots", reject, null);
						}
					}

				});

			});
		};

		// begin promise chain
		updateSession()
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully updated",
				"result": result
			}))
		}).catch(err => { return error.sendError(err.name, err.message, res); });
	}

};