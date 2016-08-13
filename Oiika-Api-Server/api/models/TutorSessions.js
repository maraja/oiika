var mongoose = require('mongoose');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var TutorSessions = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    tutor_id : { type: ObjectId, unique: true, index: true, required: true },
    // account id of tutor
    account_id : { type: ObjectId, unique: true, index: true, required: true },
    sessions: [{
      // account id of tutee reviews are associated to
      tutee_id : { type: ObjectId, index: true, required: true },
      // date and time the exception begins at
      date: {type: Date, required: true},
      // duration in 30 minute periods the exception ends at.
      duration: {type: Number, required: true}
    }]
  }, {strict:true, collection: 'tutorSessions' });

  // Export
  return mongoose.model('TutorSessions', TutorSessions);

};