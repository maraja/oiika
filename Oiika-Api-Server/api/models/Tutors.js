var mongoose = require('mongoose');
var utils = require('../../mongo/mongoose-utils');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var Tutors = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    // REQUIRED
    account_id : { type: ObjectId, index: true, required: false },
    first_name : { type: String, required: true, validate: [utils.validate.length(2), 'first name must be at least 2 characters long.'] },
    last_name : { type: String, required: true, validate: [utils.validate.length(2), 'last name must be at least 2 characters long.'] },
    email : { type: String, required: true, lowercase: true, index: true, unique: true, trim: true, validate: [utils.validate.email, 'invalid email entered.'] },
    account_type : { type: String, required: true, validate: [utils.validate.account, 'invalid account type.'] },

    // NOT REQUIRED
    short_description: { type: String, required: false, trim: true},
    full_description: { type: String, required: false, trim: true},
    hourly_rate: { type: Number, required: false},
    currentLocation: {
      city: { type: String, required: false, trim: false},
      // latitude of location
      lat: { type: Number, required: false, validate: [utils.validate.lat, 'not a valid latitude']},
      // longitude of location
      lng: { type: Number, required: false, validate: [utils.validate.lng, 'not a valid longitude']},
    },
    // distance tutor is willing to travel
    // Note: Calculated based on just an integer value for lat and long. Algorithm to calculate KM distance should be created later.
    travel_distance: { type: Number, required: false},
    hours_worked: { type: Number, required: false},
    rating: { type: Number, required: false},
    skills: { type: [String], required: false},
    profile_picture: { type: String, required: false}
  }, {strict:true, collection: 'tutors' });

  // Export
  return mongoose.model('Tutors', Tutors);

};