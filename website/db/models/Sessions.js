var mongoose = require('mongoose');

module.exports = function() {

  var Sessions = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    tutor_id: { type: String, required: true },
    tutee_id: { type: String, required: true },
    subject_id: { type: String, required: true },
    datetime: { type: Date, required: true },
    duration: { type: Number, required: false },
    hourly_rate: { type: Number, required: false }
  }, {strict:true, collection: 'sessions' });

  // Export
  return mongoose.model('Sessions', Sessions);

};
