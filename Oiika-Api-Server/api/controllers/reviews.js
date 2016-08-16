
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
		}, function(err, resultDocument) {

			if(err) {
				return error.errorHandler(err, null, null, reject, null);
			} else {
				return resolve(resultDocument);
			}

		});

	});
};

// create blank review document upon account creation
function createReview(req, res){

	var review = req.swagger.params.review.value;

	var fields = {
		text: 'text',
		rating: 'rating',
		date: 'date',
		tuteeId: 'tutee_id'
	};
	
	var fields_to_insert = {};

	// create a promise array to execute through
	var map = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_insert object.
	_.each(fields, function(element, content){

		map.push(new Promise(function(resolve, reject) {

			// map input fields to db fields.
			switch(content){
				case "date":
					review[content] = new Date();
				default:
					fields_to_insert[fields[content]] = review[content];
					return resolve();
					break;
			}

		})

	)});

	// create a promise variable to insert into the database.
	var insertToDb = function(){
		return new Promise(function(resolve, reject) {

			reviewModel.findOneAndUpdate(
			{
				account_id: review.tutorId
			},
			// set the old schedule as the new schedule
			// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
			{
				$push: {
					reviews: fields_to_insert
				}
			},
			// this will return updated document rather than old one and run validators
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
					return resolve(resultDocument.reviews);
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
				return error.errorHandler(err, null, null, reject, null);
			} else if (!resultDocument) {
				return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
			} else {
				return resolve(resultDocument);
			}

		});

	});
};
