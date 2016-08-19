var mongoose = require('mongoose');
var utils = require('../../mongo/mongoose-utils');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var Sessions = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    // account id of tutee
    tutee_id : { type: ObjectId, index: true, required: true },
	// account id of tutor reviews are associated to
	tutor_id : { type: ObjectId, index: true, required: true },
	// id of the subject in this tutoring session - NOTE: set to false for now for testing
	subject_id : { type: ObjectId, index: true, required: false},
    sessions: [{
      // date and time the exception begins at
      date: {type: Date, required: true},
      // duration in 30 minute periods the exception ends at.
      duration: {type: Number, required: true, validate: [utils.validate.duration, 'invalid duration entered']}
    }]
  }, {strict:true, collection: 'sessions' });

  // Export
  return mongoose.model('Sessions', Sessions);

};