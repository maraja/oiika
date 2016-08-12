var mongoose = require('mongoose');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var Schedules = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    tutor_id : { type: ObjectId, unique: true, index: true, required: true },
    account_id : { type: ObjectId, unique: true, index: true, required: true },
    schedule: { 
      "0": {type: [String], required: true},
      "1": {type: [String], required: true},
      "2": {type: [String], required: true},
      "3": {type: [String], required: true},
      "4": {type: [String], required: true},
      "5": {type: [String], required: true},
      "6": {type: [String], required: true}
    },
    schedule_exceptions: [{
      // date and time the exception begins at
      datetime: {type: Date, required: true},
      // duration in 30 minute periods the exception ends at.
      duration: {type: Number, required: true}
    }]
  }, {strict:true, collection: 'schedules' });

  // Export
  return mongoose.model('Schedules', Schedules);

};