const subjectModel = app.models.subjectModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {

	getAllSubjects: (req, res) => {
		subjectModel.find({}, (err, resultDocument) => {

			if(err) {
				return error.errorHandler(err, null, null, null, res);
			} else if (resultDocument.length===0) {
				return error.errorHandler(null, "NO_SUBJECTS", "No skills could be found.", null, res);
			} else {
				// proceed with insert
				return res.send(resultDocument);
			}
		});
	},

	getSubjectsByName: (req, res) => {
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
		let name = req.swagger.params.subjectName.value;

		// escape entered string
		let regexName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '');
		regexName = new RegExp(".*" + regexName + ".*", "gi");

		if (name.length > 2){
			subjectModel.find({name: regexName}, function(err, resultDocument) {

				if(err) {
					return error.errorHandler(err, null, null, null, res);
				} else if (resultDocument.length===0) {
					return error.errorHandler(null, "NO_SUBJECTS", "No skills could be found.", null, res);
				} else {
					return res.send(resultDocument);
				}
			});
		} else {
			return error.errorHandler(null, "INVALID_SEARCH", "Subject search string must be more than 2 letters long.", null, res);
		}
	},

	getSubjectsBylevel: (req, res) => {
		let level = parseInt(req.swagger.params.subjectLevel.value);

		subjectModel.find({level: level}, (err, resultDocument) => {

			if(err) {
				return error.errorHandler(err, null, null, null, res);
			} else if (resultDocument.length===0) {
				return error.errorHandler(null, "NO_SUBJECTS", "No subjects could be found.", null, res);
			} else {
				return res.send(resultDocument);
			}

		});
	},

	createSubject: (req, res) => {

		let subject = req.swagger.params.subject.value;

		let fields = {
			name: 'name',
			level: 'level'
		};
		
		let fields_to_insert = {};

		// create a promise array to execute through
		let map = [];

		// populate promise array with new promises returning resolved after validating fields and assigning
		// them into the fields_to_insert object.
		_.each(fields, (element, content) => {

			map.push(new Promise((resolve, reject) => {

				// map input fields to db fields.
				fields_to_insert[fields[content]] = subject[content];
				return resolve();

			})

		)});

		let checkSubjects = () => {

			return new Promise((resolve, reject) => {

				subjectModel.findOne({ 
					$and : [
						{ name: { $eq: subject.name.toLowerCase() } } , //(subject.name+' = (this.name)') },
						{ level: { $eq: subject.level } }  //(subject.level+' = (this.level)') }
					]
				}, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, res);
					} else if (!resultDocument) {
						// proceed with insert
						return resolve();
					} else {
						return error.errorHandler(null, "SUBJECT_CONFLICT", "Entered subject and level already exists.", reject, res);
					}
				});

			});	
		};

		let insertToDb = () => {

			return new Promise((resolve, reject) => {

				subjectModel.create(fields_to_insert, (err, resultDocument) => {

					if(err) {
						return error.errorHandler(err, null, null, reject, null);
					}
					else {
						return resolve(resultDocument);
					}

				});

			});
		};


		// begin promise chain.
		Promise.all(map)
		// check subject collection to see if conflict exists
		.then(checkSubjects)
		// if no conflicts, insert the subject into the db
		.then(insertToDb)
		// output result
		.then(result => {
			return res.send(JSON.stringify({
				"message": "Successfully created",
				"result": result
			}));
		})
		// catch any errors along the way.
		.catch(err => {
			return error.sendError(err.name, err.message, res); 
		});
	}

};
