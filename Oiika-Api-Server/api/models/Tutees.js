var mongoose = require('mongoose');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var enumAccountType = ['local', 'facebook', 'google'];

  var Tutees = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    account_id : { type: ObjectId, index: true, required: false },
    first_name : { type: String, required: true, trim: true },
    last_name : { type: String, required: true, trim: true },
    email : { type: String, index: true, unique: true, required: true, lowercase: true, trim: true },
    account_type : { type: String, enum: enumAccountType, required: true },
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