
const reviewModel = app.models.reviewModel;
const tuteeModel = app.models.tuteeModel;
const tutorModel = app.models.tutorModel;
const accountModel = app.models.accountModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {

	// create blank review document upon account creation
	createReview: (req, res) => {

		var review = req.swagger.params.review.value;

		var fields = {
			tutorId: 'tutor_id',
			tuteeId: 'tutee_id',
			text: 'text',
			rating: 'rating',
			date: 'date'
		};
		
		var fields_to_insert = {};

		// create a promise array to execute through
		var map = [];

		// populate promise array with new promises returning resolved after validating fields and assigning
		// them into the fields_to_insert object.
		_.each(fields, function(element, content){

			map.push(new Promise(function(resolve, reject) {

				fields_to_insert[fields[content]] = review[content];
				return resolve();

			})

		)});

		// create a promise variable to insert into the database.
		var insertToDb = function(){
			return new Promise(function(resolve, reject) {

				reviewModel.create(fields_to_insert, function(err, resultDocument) {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					}
					else {
						return resolve(resultDocument);
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
	},

	// get all of a tutor's reviews by their account ID
	getTutorReviewsByAccountId: (req, res) => {

		let tutorId = req.swagger.params.tutorId.value;
		let tutees = [];
		let allReviews = [];

		let getReviews = () => { 
			return new Promise((resolve, reject) => {

				reviewModel.find(
				{
					tutor_id: tutorId
				},
				// {
				// 	reviews: 1
				// 	_id: 0
				// }, 
				(err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					// } else if (resultDocument.length===0) {
					// 	return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
					} else {
						// allReviews = resultDocument;
						return resolve(resultDocument);
					}

				});

			});
		};

		let getTutorInfo = reviews => {

			_.each(reviews, (element, content) => {
				tutees.push(new Promise((resolve, reject) => {

						accountModel.findOne(
						{
							_id: element.tutee_id
						},
						// {
						// 	reviews: 1
						// 	_id: 0
						// }, 
						(err, resultDocument) => {

							if(err) {
								return error.errorHandler(err, null, null, reject, null);
							} else if (!resultDocument) {
								return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
							} else {

								let assignValues = () => {
									return new Promise((resolve, reject) => {
										allReviews.push({
											tutor_id: element.tutor_id,
											tutee_id: element.tutee_id,
											first_name: resultDocument.first_name,
											profile_picture: resultDocument.profile_picture,
											text: element.text,
											rating: element.rating,
											date: element.date
										});
										return resolve();
									})
								}

								assignValues()
								.then(() => { 
									return resolve(reviews);
								})
								
							}

						});

					})
				)}
			);
		};

		getReviews()
		.then(getTutorInfo)
		.then(() => {
			Promise.all(tutees)
			.then(() => { return res.send(allReviews) })
			.catch(err => { return error.sendError(err.name, err.message, res); });
		}).catch(err => { return error.sendError(err.name, err.message, res); });
	}

};
