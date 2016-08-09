var mongoose = require('mongoose');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var Reviews = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    tutor_id : { type: ObjectId, unique: true, index: true, required: true },
    account_id : { type: ObjectId, unique: true, index: true, required: true },
    reviews: { 
      monday: {type: [Number], required: true},
      tuesday: {type: [Number], required: true},
      wednesday: {type: [Number], required: true},
      thursday: {type: [Number], required: true},
      friday: {type: [Number], required: true},
      saturday: {type: [Number], required: true},
      sunday: {type: [Number], required: true}
    }
  }, {strict:true, collection: 'reviews' });

  // Export
  return mongoose.model('Reviews', Reviews);

};