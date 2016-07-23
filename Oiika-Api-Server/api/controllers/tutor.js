const tutorModel = require('../models/Tutors')();
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

	if (params.city.value){ getTutorByCity(req, res, params.city.value) }
	else { getAllTutors(req, res) }

}

function getAllTutors(req, res) {
	tutorModel.find({}, function(err, docs) {
		if(err) {
			console.log(err);
			error.sendError(err.name, err.message, res);
		}
		else {
			return res.send(docs);
		}
	});
}

function getTutorByCity(req, res, city) {
	tutorModel.find({city: city}, function(err, docs) {
		if(err) {
			console.log(err);
			error.sendError(err.name, err.message, res);
		}
		else {
			return res.send(docs);
		}
	});
}

function createTutor(req, res) {
	var tutor = req.swagger.params.tutor.value;
	var fields = {
		first_name:'', 
		last_name: '', 
		email: '',
		short_description: '', 
		full_description: '',
		city: '', 
		hourly_rate: '',
		hours_worked: '',
		rating: '',
		skills: '',
		profile_picture: ''
	};

	var errors = [];
	var fields_to_post = {};

	// create a promise array to execute through
	var validations = [];

	// populate promise array with new promises returning resolved after validating fields and assigning
	// them into the fields_to_post object.
	_.each(fields, function(element, content){

		validations.push(new Promise(function(resolve, reject) {

			if (valid.validate(content, tutor[content], errors)){
				fields_to_post[content] = tutor[content];
			}

			resolve();

		})

	)});

	// create a promise variable to insert into the database.
	var postToDb = function(){
		return new Promise(function(resolve, reject) {
			tutorModel.create(fields_to_post, function(err, result) {

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
					"Fail": "Failed to post with errors",
					"errors": errors
				}))
				reject("Error");
			} else { resolve(); }
		})
	})
	// post to database sending returned document down promise chain
	.then(postToDb)
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
