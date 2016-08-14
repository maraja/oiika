var mongoose = require('mongoose');
var utils = require('../../mongo/mongoose-utils');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var Tutees = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    account_id : { type: ObjectId, index: true, required: false },
    first_name : { type: String, required: true, validate: [utils.validate.length(2), 'first name must be at least 2 characters long.'] },
    last_name : { type: String, required: true, validate: [utils.validate.length(2), 'last name must be at least 2 characters long.'] },
    email : { type: String, required: true, lowercase: true, index: true, unique: true, trim: true, validate: [utils.validate.email, 'invalid email entered.'] },
    account_type : { type: String, required: true, validate: [utils.validate.account, 'invalid account type.'] },
    city: { type: String, required: false, trim: false},
    reviews: [{ 
      review: {type: String, required: false},
      rating: {type: Number, required: false},
      createdAt: {type: Date, required: false}
    }]
  }, {strict:true, collection: 'tutees' });

  // Export
  return mongoose.model('Tutees', Tutees);

};