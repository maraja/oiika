var mongoose = require('mongoose');

module.exports = function() {

  var Users = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    first_name : { type: String, required: true },
    last_name : { type: String, required: true },
    email : { type: String, required: true, lowercase: true, trim: true },
    password : { type: String, required: true },
    address: { type: String },
    city: { type: String },
    postal_code: { type: String },
    hours_taught: { type: Number, required: false},
    rating: { type: Number, required: false},
    profile_picture: { type: String, required: false}
  }, {strict:true, collection: 'users' });

  // Export
  return mongoose.model('Users', Users);

};
