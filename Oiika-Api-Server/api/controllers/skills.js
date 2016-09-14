const skillModel = app.models.skillModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');
const regexHelper = require('../helpers/regex');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {

	getAllSkills: (req, res) => {

		let getAllSkills = () => {

			return new Promise((resolve, reject) => {

				skillModel.find({}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (resultDocument.length===0) {
						return error.errorHandler(null, "NO_SKILLS", "No skills could be found.", reject, res);
					} else {
						return resolve(resultDocument);
					}

				});

			});

		};

		// begin promise chain.
		getAllSkills()
		// output result
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully inserted",
				"result": result
			}));
		})
		// catch any errors along the way.
		.catch(err => {
			return error.sendError(err.name, err.message, res); 
		});
	},

	getSkillsByName: (req, res) => {
		// ref: http://stackoverflow.com/questions/17885855/use-dynamic-variable-string-as-regex-pattern-in-javascript

		// function escapeRegExp(stringToGoIntoTheRegex) {
		//     return stringToGoIntoTheRegex.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		// }

		// var stringToGoIntoTheRegex = escapeRegExp("abc"); // this is the only change from above
		// var regex = new RegExp("#" + stringToGoIntoTheRegex + "#", "g");
		// // at this point, the line above is the same as: var regex = /#abc#/g;

		// var input = "Hello this is #abc# some #abc# stuff.";
		// var output = input.replace(regex, "!!");
		// alert(output); // Hello this is !! some !! stuff.
		let name = req.swagger.params.skillName.value;

		// escape entered string
		let regexName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '');
		regexName = new RegExp(".*" + regexName + ".*", "gi");

		if (name.length > 2){
			skillModel.find({
				$or: [
					{ name: regexName },
					{ subskills: { $in: [regexName] } }
				]
			}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, null, res);
				} else if (resultDocument.length===0) {
					return error.errorHandler(null, "NO_SKILLS", "No skills could be found.", null, res);
				} else {
					return res.send(resultDocument);
				}
			});
		} else {
			return error.errorHandler(null, "INVALID_SEARCH", "Skill search string must be more than 2 letters long.", null, res);
		}
	},

	createSkill: (req, res) => {
		let skill = req.swagger.params.skill.value;

		let insertToDb = () => {

			return new Promise((resolve, reject) => {

				skillModel.create({name: skill.name.toLowerCase()}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else {
						return resolve(resultDocument);
					}

				});

			});

		};

		// begin promise chain.
		insertToDb()
		// output result
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully inserted",
				"result": result
			}));
		})
		// catch any errors along the way.
		.catch(err => {
			return error.sendError(err.name, err.message, res); 
		});
	},

	createSubskill: (req, res) => {

		let skill = req.swagger.params.skill.value;
		// skill.subskill = skill.subskill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '');

		let inputSanitization = () => {

			return new Promise((resolve, reject) => {

				let re = /[-\/\\^$*+?.()|[\]{}]/g;
				if(regexHelper.isValidString(skill.subskill)){
					return error.errorHandler(null, "INVALID_INPUT", "Invalid subskill entered.", reject, null);
				} else { 
					return resolve(); 
				}

			});

		};

		let insertToDb = () => {

			return new Promise((resolve, reject) => {

				skillModel.findOneAndUpdate(
				{
					name: skill.name.toLowerCase()
				},
				// set the old schedule as the new schedule
				// beware - validation only done by swagger using the swagger.yaml definitions for this endpoint.
				{
					$push: {
						subskills: skill.subskill
					}
				},
				// this will return updated document rather than old one
				{ 
					// upsert: true,
					new : true,
					runValidators : true 
				},
				(err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					} else if (!resultDocument) {
						return error.errorHandler(null, "INVALID_SKILL", "ID does not exist.", reject, null);
					} else {
						return resolve(resultDocument);
					}

				});

			});

		};


		// begin promise chain.
		inputSanitization()
		.then(insertToDb)
		// insertToDb()
		// output result
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully inserted",
				"result": result
			}));
		})
		// catch any errors along the way.
		.catch(err => {
			return error.sendError(err.name, err.message, res); 
		});
	},

};
