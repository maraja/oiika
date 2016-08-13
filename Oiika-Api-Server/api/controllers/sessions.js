
const tutorSessionModel = app.models.tutorSessionModel;
const tuteeSessionModel = app.models.tuteeSessionModel;
const tutorModel = app.models.tutorModel;

// var ObjectId = require('mongodb').ObjectId;

const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');
const moment = require('moment');

module.exports = {
	createSession: createSession,
	createBlankSession: createBlankSession,
	getTutorSessionByEmail: getTutorSessionByEmail,
	getTuteeSessionByEmail: getTuteeSessionByEmail,
	getTuteeSessionsByAccountId: getTuteeSessionsByAccountId
}

function getTutorSessionByEmail(req, res) {
	var params = req.swagger.params;
	var errors = [];

	var getTutorId = new Promise(function(resolve, reject){
		if(valid.validate("email", params.email.value, errors)) {
			tutorModel.findOne({email: params.email.value}, {email: 1}, function(err, doc) {
				if(err) {
					reject(err);
				} else if (!doc){
					var err = error.makeError("INVALID_EMAIL", "Them email you've entered does not exist.");
					reject(err);
				} else {
					resolve(doc._id);
				}
			});
		} else {
			error.sendError("Error", errors[0], res);
		}
	});

	getTutorId.then(function(tutorId){
		console.log(tutorId);
		sessionModel.find({tutor_id: tutorId}, function(err, docs) {
			if(err) {
				error.sendError(err.name, err.message, res);
			}
			else {
				return res.send(docs);	
			}
		});
	}).catch(function(err){
		error.sendError(err.name, err.message, res);
	});
};

function getTuteeSessionByEmail(req, res) {
	var params = req.swagger.params;
	var errors = [];

	if(valid.validate("email", params.email.value, errors)) {
		sessionModel.find({tutee_id: params.email.value}, function(err, docs) {
			if(err) {
				console.log(err);
				error.sendError(err.name, err.message, res);
			}
			else {
				return res.send(docs);
			}
		});
	} else {
		error.sendError("Error", errors[0], res);
	}
};


function getTuteeSessionsByAccountId(req, res) {
	var params = req.swagger.params;
	var accountId = params.accountId.value;

	var getSessions = function(){
		return new Promise(function(resolve, reject) {
			tuteeSessionModel.findOne(
			{
				account_id: accountId
			},
			{
				sessions: 1,
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
					resolve(resultDocument.sessions);
				}

			});
		});
	};

	getSessions
	.then(function(sessions){
		return res.send(JSON.stringify(sessions))
	}).catch(function(err){
		error.sendError(err.name, err.message, res); 
	});
};

function createBlankSession(accountId, userId, userType){

	// create blank model and id for placeholders to insert into respective collections
	var model, id;
	switch (userType){
		case "tutee":
			model = tuteeSessionModel;
			id = 'tutee_id';
			break;
		case "tutor":
			model = tutorSessionModel;
			id = 'tutor_id';
			break;
		default:
			break;
	}
	// create blank document
	return new Promise(function(resolve, reject) {

		// create empty schedule for each tutor created
		model.create({
			[id] : userId,
			account_id : accountId
	    // throw errors as necessary
		}, function(err, result) {

			if(err) {
				switch (err.name){
					case (/\*Error/):
					case "ValidationError":
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
			}
			else {
				resolve(result);
			}

		});

	});

};

// TODO: revamp this for new model.
function createSession(req, res) {
	var session = req.swagger.params.session.value;

	console.log(session);

};