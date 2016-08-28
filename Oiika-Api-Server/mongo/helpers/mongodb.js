var mongoose = require('mongoose');
// var tutorModel = require('../models/Tutors')();
var config = require('../../config');

module.exports = {
	dbConnection: dbConnection,
	getAllTutors: getAllTutors
}

function dbConnection(){

	// MONGOOSE MONGODB CONNECTION TEST

	console.log('Using '+config.environment+' database...');

	var db = config.db[config.environment];
	var db_connection_string = db.dialect + "://" + 
		db.username + ":" + 
		db.password + "@" +
		db.host + ":" + 
		db.port + "/" + 
		db.database;

	return mongoose.connect(db_connection_string);

	// var mongo_db = mongoose.connect(db_connection_string);

	// tutorModel.find({}, function(err, docs) {
	// 	if(err) {
	// 		console.log(err);
	// 		return false;
	// 	}
	// 	else {
	// 		console.log(docs);
	// 		return mongo_db;
	// 	}
	// });
	// END MONGO TEST

}

function getAllTutors(req, res, next){
	// tutorModel.find({}, function(err, docs) {
	// 	if(err) {
	// 		console.log(err);
	// 		req.tutors = null;
	// 		next();
	// 	}
	// 	else {
	// 		req.tutors = docs;
	// 		next();
	// 	}
	// });
}