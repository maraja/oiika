var mongoose = require('mongoose');

module.exports = function() {

  var Tutors = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    first_name : { type: String, required: true, lowercase: true, trim: true },
    last_name : { type: String, required: true, lowercase: true, trim: true },
    email : { type: String, index: true, unique: true, required: true, lowercase: true, trim: true },
    short_description: { type: String, required: false},
    full_description: { type: String, required: false},
    city: { type: String, required: true, trim: true},
    hourly_rate: { type: Number, required: true},
    // latitude of location
    location_lat: { type: Number, required: true},
    // longitude of location
    location_lng: { type: Number, required: true},
    // distance tutor is willing to travel
    // Note: Calculated based on just an integer value for lat and long. Algorithm to calculate KM distance should be created later.
    travel_distance: { type: Number, required: true},
    hours_worked: { type: Number, required: false},
    rating: { type: Number, required: false},
    skills: { type: [String], required: false},
    profile_picture: { type: String, required: false}
  }, {strict:true, collection: 'tutors' });

  // Export
  return mongoose.model('Tutors', Tutors);

};