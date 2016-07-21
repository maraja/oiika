const tutorModel = require('../models/Tutors')();

module.exports = {
	getAllTutors: getAllTutors
};

function getAllTutors(req, res) {
	tutorModel.find({}, function(err, docs) {
		if(err) {
			console.log(err);
			return res.send({"Error": "Something happened"});
		}
		else {
			return res.send(docs);
		}
	});
}