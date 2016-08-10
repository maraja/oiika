
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
function createReview(accountId, fields){

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

function getTutorReviewsByAccountId(accountId){
	return new Promise(function(resolve, reject) {

		reviewModel.find(
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
			} else if (resultDocument.length==0){
				error.makeError("INVALID_ID", "ID does not exist.")
				.then(function(error){
					reject(error);
				});
			} else {
				resolve(resultDocument[0].reviews);
			}

		});

	});
};
