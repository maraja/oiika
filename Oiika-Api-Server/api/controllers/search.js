const tutorModel = app.models.tutorModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const schedules = require('./schedules');
const reviews = require('./reviews');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	getTutorsByLocation: getTutorsByLocation
};

function getTutorsByLocation(req, res){

	var sw_lat = req.swagger.params.sw_lat.value;
	var sw_lng = req.swagger.params.sw_lng.value;
	var ne_lat = req.swagger.params.ne_lat.value;
	var ne_lng = req.swagger.params.ne_lng.value;

	var errors = [];

	// look for all tutors within a given area of current location
	// NOTE: current location consists of a Northeast lat, long and a Southwest lat, long
	tutorModel.find({ 
		$and : [
			{ $where : (sw_lat+' < (this.currentLocation.lat)') },
			{ $where : (sw_lng+' < (this.currentLocation.lng)') },
			{ $where : (ne_lat+' > (this.currentLocation.lat)') },
			{ $where : (ne_lng+' > (this.currentLocation.lng)') }
		]
	}, function(err, resultDocument) {
		if(err) {
			console.error(err);
			switch (err.name){
				case "ValidationError":
				case "CastError":
				case "MongoError":
					error.makeError(err.name, err.message)
					.then(function(err){
						error.sendError(err.name, err.message, res); 
					});
					break;
				default:
					error.makeMongooseError(err)
					.then(function(err){
						error.sendError(err.name, err.message, res); 
					});
					break;
			}
		} else if (resultDocument.length==0){
			error.makeError("BAD_SEARCH", "No Tutors in the area provided.")
			.then(function(err){
				error.sendError(err.name, err.message, res); 
			});
		}
		else {
			return res.send(resultDocument);
		}
	});
};
