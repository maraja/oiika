var mongoose = require('mongoose');
var utils = require('../../mongo/mongoose-utils');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var Schedules = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    tutor_id : { type: ObjectId, unique: true, index: true, required: true },
    account_id : { type: ObjectId, unique: true, index: true, required: true },
    schedule: { 
      "0": {type: [String], required: false, validate: [utils.validate.schedule_time, 'invalid time entered for Sunday.']},
      "1": {type: [String], required: false, validate: [utils.validate.schedule_time, 'invalid time entered for Monday.']},
      "2": {type: [String], required: false, validate: [utils.validate.schedule_time, 'invalid time entered for Tuesday.']},
      "3": {type: [String], required: false, validate: [utils.validate.schedule_time, 'invalid time entered for Wednesday.']},
      "4": {type: [String], required: false, validate: [utils.validate.schedule_time, 'invalid time entered for Thursday.']},
      "5": {type: [String], required: false, validate: [utils.validate.schedule_time, 'invalid time entered for Friday.']},
      "6": {type: [String], required: false, validate: [utils.validate.schedule_time, 'invalid time entered for Saturday.']}
    },
    // schedule_exceptions: [{
    //   // date and time the exception begins at
    //   date: {type: Date, required: true},
    //   // duration in 30 minute periods the exception ends at.
    //   duration: {type: Number, required: true, validate: [utils.validate.duration, 'invalid duration entered.']}
    //   String: {
    //     all_day : {type: Boolean, required: true},
    //     timeslots: {type: [String], required: false, validate: [utils.validate.time, 'invalid time entered within timeslots.']}
    //   }
    // }]
    schedule_exceptions : [mongoose.Schema.Types.Mixed]

  }, {strict:true, collection: 'schedules' });

  // Export
  return mongoose.model('Schedules', Schedules);

};