var mongoose = require('mongoose');
var utils = require('../../mongo/mongoose-utils');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var Sessions = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
	// account id of tutor reviews are associated to
	tutor_id : { type: ObjectId, index: true, required: true },
    // account id of tutee
    tutee_id : { type: ObjectId, index: true, required: true },
	// id of the subject in this tutoring session - NOTE: set to false for now for testing
	subject_id : { type: ObjectId, index: true, required: false},
	hourly_rate: { type: Number, required: true },
	date: {type: Date, required: true },
	timeslots: {type: [String], required: true, validate: [utils.validate.session_time, 'invalid time entered.']}
  }, {strict:true, collection: 'sessions' });

  // Export
  return mongoose.model('Sessions', Sessions);

};