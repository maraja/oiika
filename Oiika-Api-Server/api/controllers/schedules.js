
// const scheduleModel = app.models.scheduleModel;
const tutorModel = app.models.tutorModel;
const error = require('../helpers/errors');


const Promise = require('bluebird');
const _ = require('underscore');

module.exports = {

	getTutorScheduleByAccountId: (req, res) => {

		let tutorId = req.swagger.params.tutorId.value;

		let findSchedule = () => {
			return new Promise((resolve, reject) => {

				tutorModel.findOne(
				{
					tutor_id: tutorId
				},
				{
					schedule: 1,
					_id: 0
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
					} else {
						return resolve(resultDocument.schedule);
					}

				});

			});
		}

		findSchedule()
		.then(result => { return res.send(resultDocument); })
		.catch(err => { return error.sendError(err.name, err.message, res); });
	},

	// update schedule by account id
	updateTutorSchedule: (req, res) => {

		let schedule = req.swagger.params.schedule.value;

		let updateSchedule = () => {
			return new Promise((resolve, reject) => {

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
				(err, resultDocument) => {

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

		// begin promise chain
		updateSchedule()
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully updated",
				"result": result
			}))
		}).catch(err => { return error.sendError(err.name, err.message, res); });
	},

	updateScheduleExceptions: (req, res) => {

		var exceptions = req.swagger.params.scheduleExceptions.value;
		// console.log(exceptions);
		var tutorId = exceptions.tutorId;

		// var fields = {
		// 	date: 'date',
		// 	duration: 'duration',
		// 	timeslots: 'timeslots'
		// };
		
		// var fields_to_insert = {};

		// // create a promise array to execute through
		// var map = [];

		// // populate promise array with new promises returning resolved after validating fields and assigning
		// // them into the fields_to_insert object.
		// _.each(exceptions, function(element, content){

		// 	_.each(element, function(obj, arrayItem){

		// 		map.push(new Promise(function(resolve, reject) {

		// 			// check for required and non required fields to validate accordingly.
		// 			console.log(element);
		// 			console.log(content);
		// 			console.log(obj);
		// 			console.log(arrayItem);
		// 			// switch (content){
		// 			// 	case "tutorId":
		// 			// 		break;
		// 			// 	default:
		// 			// 		fields_to_insert[content] = exceptions[content];
		// 			// 		break;
		// 			// }

		// 			return resolve();

		// 		})

		// 	)}

		// )});

		// create a promise variable to insert into the database.
		var insertToDb = function(){
			return new Promise(function(resolve, reject) {

				tutorModel.findOneAndUpdate(
				{
					tutor_id: tutorId
				},
				// set the old schedule as the new schedule
				// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
				{
					$push: {
						schedule_exceptions: {
							$each: exceptions.exceptions
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
						return error.errorHandler(err, null, null, reject, null);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
					} else {
						return resolve(resultDocument.schedule_exceptions);
					}

				});

			})
		};


		insertToDb()
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
	}

};