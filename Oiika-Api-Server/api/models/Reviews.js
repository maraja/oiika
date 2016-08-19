var mongoose = require('mongoose');
var utils = require('../../mongo/mongoose-utils');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var Reviews = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    // account id of tutor reviews are associated to
    tutor_id : { type: ObjectId, index: true, required: true },
    // account id of tutee reviews are associated to
    tutee_id : { type: ObjectId, index: true, required: true },
    text : { type: String, required: true },
    rating : { type: Number, required: true },
    date : { type: Date, required: true }
  }, {strict:true, collection: 'reviews' });

  // Export
  return mongoose.model('Reviews', Reviews);

};