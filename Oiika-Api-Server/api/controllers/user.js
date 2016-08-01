
const userModel = app.models.userModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {
	getTutorsByParameter: getTutorsByParameter,
	createTutor: createTutor
};

function getTutorsByParameter(req, res){
	var params = req.swagger.params;

	if (params.city.value){ getTutorByCity(req, res, params.city.value); }
	else if (params.email.value){ getTutorByEmail(req, res, params.email.value); }
	else if (params.lat.value && params.lng.value){ getTutorByLocation(req, res, params.lat.value, params.lng.value); }
	else { getAllTutors(req, res) }

}

function getTutorByLocation(req, res, locationLat, locationLng){
	var errors = [];
	// var tutors = [];

	if(valid.validate("location_lat", locationLat, errors) && valid.validate("location_lng", locationLng, errors)) {
		userModel.find({ 
			$and : [
				{ $where : (locationLat+' < (this.location_lat+this.travel_distance)') },
				{ $where : (locationLat+' > (this.location_lat-this.travel_distance)') },
				{ $where : (locationLng+' < (this.location_lng+this.travel_distance)') },
				{ $where : (locationLng+' > (this.location_lng-this.travel_distance)') }
			]
		}, function(err, docs) {
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
}

function getAllTutors(req, res) {
	userModel.find({}, function(err, docs) {
		if(err) {
			console.log(err);
			error.sendError(err.name, err.message, res);
		}
		else {
			res.send(docs);
		}
	});
}

function getTutorByCity(req, res, city) {

	var errors = [];

	if(valid.validate("city", city, errors)) {
		userModel.find({city: city}, function(err, docs) {
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
	
}

function getTutorByEmail(req, res, email){

	var errors = [];

	if(valid.validate("email", email, errors)) {
		userModel.find({email: email}, function(err, docs) {
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

}

function createTutor(req, res) {
	var tutor = req.swagger.params.tutor.value;
	// field mapping with database names as values
	var fields = {
		first_name:'first_name', 
		last_name: 'last_name', 
		email: 'email',
		short_description: 'short_description', 
		full_description: 'full_description',
		city: 'city', 
		location_lat: 'location_lat',
		location_lng: 'location_lng',
		travel_distance: 'travel_distance',
		hourly_rate: 'hourly_rate',
		hours_worked: 'hours_worked',
		rating: 'rating',
		skills: 'skills',
		profile_picture: 'profile_picture'
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
				case "first_name":
				case "last_name":
				case "email":
				case "city":
				case "location_lat":
				case "location_lng":
				case "travel_distance":
				case "hourly_rate":
					if (valid.validate(content, tutor[content], errors, true)){
						fields_to_insert[fields[content]] = tutor[content];
					}
					break;
				case "short_description":
				case "full_description":
				case "hours_worked":
				case "rating":
				case "skills":
				case "profile_picture":
					if (valid.validate(content, tutor[content], errors, false)){
						fields_to_insert[fields[content]] = tutor[content];
					}
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
			userModel.create(fields_to_insert, function(err, result) {

				if(err) {
					console.log(err); 
					reject("Something happened");
				}
				else {
					resolve(result);
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
				return res.send(JSON.stringify({
					"Fail": "Failed to insert with errors",
					"errors": errors
				}));
				reject("Error");
			} else { resolve(); }
		})
	})
	// post to database sending returned document down promise chain
	.then(insertToDb)
	// handle success accordingly
	.then(function(result){
		return res.send(JSON.stringify({
			"Success": "Successfully inserted",
			"Result": result
		}))

	})
	// catch all errors and handle accordingly
	.catch(function(err){
		error.sendError(err.name, err.message, res);
	});

	// var first_name = tutor.first_name;
	// var last_name = tutor.last_name;
	// var email = tutor.email;
	// var short_description = tutor.short_description;
	// var full_description = tutor.full_description;
	// var city = tutor.city;
	// var hourly_rate = tutor.hourly_rate;
	// var hours_worked = tutor.hours_worked;
	// var rating = tutor.rating;
	// var skills = tutor.skills;
	// var profile_picture = tutor.profile_picture;
}
