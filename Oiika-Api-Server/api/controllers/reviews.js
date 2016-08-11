
const reviewModel = app.models.reviewModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	getTutorReviewsByAccountId: getTutorReviewsByAccountId,
	createBlankReview: createBlankReview,
	createReview: createReview
};

// create blank review document upon account creation
function createBlankReview(accountId, tutorId){

	return new Promise(function(resolve, reject) {

		// create empty schedule for each tutor created
		reviewModel.create({
			tutor_id: tutorId,
			account_id: accountId
	    // throw errors as necessary
		}, function(err, result) {

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
};

// create blank review document upon account creation
function createReview(req, res){

	var params = req.swagger.params;
	var tutorId = params.tutorId.value;
	var review = params.review.value;

	var fields = {
		text: 'text',
		rating: 'rating',
		date: 'date',
		tuteeId: 'tutee_id'
	};
	
	var errors = [];
	var fields_to_insert = {};

	// create a promise array to execute through
	var validations = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		validations.push(new Promise(function(resolve, reject) {

			// check for required and non required fields to validate accordingly.
			switch (content){
				case "date":
					fields_to_insert[content] = new Date();
					break;
				case "text":
				case "rating":
				case "tuteeId":
					fields_to_insert[fields[content]] = review[content];
					break;
				default:
					break;
			}

			resolve();

		})

	)});

	// create a promise variable to insert into the database.
	var insertToDb = function(){
		return new Promise(function(resolve, reject) {

			reviewModel.findOneAndUpdate(
			{
				account_id: tutorId
			},
			// set the old schedule as the new schedule
			// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
			{
				$push: {
					reviews: fields_to_insert
				}
			},
			// this will return updated document rather than old one
			{ new : true },
			function(err, resultDocument) {

				console.log(resultDocument);
				if(err) {
					switch (err.name){
						case "CastError":
						case "MongoError":
							error.makeError(err.name, err.message)
							.then(function(error){
								reject(error);
							});
							break;
						default:
							error.makeMongooseError(err)
							.then(function(error){
								reject(error);
							});
							break;
					}
				} else if (!resultDocument){
					error.makeError("INVALID_ID", "ID does not exist.")
					.then(function(error){
						reject(error);
					});
				} else {
					resolve(resultDocument);
				}

			});

		})
	};


	// begin promise chain looping through promise array.
	Promise.all(validations)
	// check for errors before posting to database
	.then(function(){
		return new Promise(function(resolve, reject) {
			if(errors.length > 0){
				error.makeError("VALIDATION_ERROR", errors)
				.then(function(error){
					reject(error);
				});
			} else { resolve(); }
		})
	})
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
		error.sendError(err.name, err.message, res); 	
	});

};

// get all of a tutor's reviews by their account ID
function getTutorReviewsByAccountId(accountId){
	return new Promise(function(resolve, reject) {

		reviewModel.findOne(
		{
			account_id: accountId
		},
		{
			reviews: 1,
			_id: 0
		}, function(err, resultDocument) {
			if(err) {
				console.log(error);
				switch (err.name){
					case "CastError":
					case "MongoError":
						error.makeError(err.name, err.message)
						.then(function(error){
							reject(error);
						});
						break;
					default:
						error.makeMongooseError(err)
						.then(function(error){
							reject(error);
						});
						break;
				}
			} else if (!resultDocument){
				error.makeError("INVALID_ID", "ID does not exist.")
				.then(function(error){
					reject(error);
				});
			} else {
				resolve(resultDocument);
			}

		});

	});
};
