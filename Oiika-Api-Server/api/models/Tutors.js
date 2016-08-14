var mongoose = require('mongoose');
var utils = require('mongoose-utils');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var enumAccountType = ['local', 'facebook', 'google'];

  var Tutors = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    // REQUIRED
    account_id : { type: ObjectId, index: true, required: false },
    first_name : { type: String, required: true, trim: true },
    last_name : { type: String, required: true, trim: true },
    email : { type: String, index: true, unique: true, required: true, lowercase: true, trim: true },
    account_type : { type: String, enum: enumAccountType, required: true },

    // NOT REQUIRED
    short_description: { type: String, required: false, trim: true},
    full_description: { type: String, required: false, trime: true},
    hourly_rate: { type: Number, required: false},
    currentLocation: {
      city: { type: String, required: false, trim: false},
      // latitude of location
      lat: { type: Number, required: false, validate: [utils.validate.latlong, 'not a valid latitude']},
      // longitude of location
      lng: { type: Number, required: false, validate: [utils.validate.latlong, 'not a valid longitude']},
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