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

	// look for all tutors within a given area of current location
	// NOTE: current location consists of a Northeast lat, long and a Southwest lat, long
	tutorModel.find({ 
		// $and : [
		// 	{ $where : (sw_lat+' < (this.currentLocation.lat)') },
		// 	{ $where : (sw_lng+' < (this.currentLocation.lng)') },
		// 	{ $where : (ne_lat+' > (this.currentLocation.lat)') },
		// 	{ $where : (ne_lng+' > (this.currentLocation.lng)') }
		// ]
	}, function(err, resultDocument) {

		if(err) {
			return error.errorHandler(err, null, null, null, res);
		// } else if (resultDocument.length===0) {
		// 	return error.errorHandler(null, "BAD_SEARCH", "No Tutors in the area provided.", null, res);
		} else {
			return res.send(resultDocument);
		}
	});
};
