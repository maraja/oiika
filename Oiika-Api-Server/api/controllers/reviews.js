
const reviewModel = app.models.reviewModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	getTutorReviewsByAccountId: getTutorReviewsByAccountId,
	createReview: createReview
};

// create blank review document upon account creation
function createReview(req, res){

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
};

// get all of a tutor's reviews by their account ID
function getTutorReviewsByAccountId(tutorId){
	return new Promise(function(resolve, reject) {

		reviewModel.find(
		{
			tutor_id: tutorId
		},
		{
			reviews: 1
			// _id: 0
		}, function(err, resultDocument) {

			if(err) {
				return error.errorHandler(err, null, null, reject, null);
			// } else if (resultDocument.length===0) {
			// 	return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, null);
			} else {
				return resolve(resultDocument);
			}

		});

	});
};
