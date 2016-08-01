var mongoose = require('mongoose');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var enumAccountType = ['local', 'facebook', 'google'];
  var enumUserType = ['tutor', 'tutee'];
  var enumGender = ['M', 'F'];

  var Accounts = new mongoose.Schema({

    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    first_name : { type: String, required: true },
    last_name : { type: String, required: true },
    email : { type: String, required: true, lowercase: true, unique: true, trim: true },
    password : { type: String, required: false },
    account_type : { type: String, enum: enumAccountType, required: true },
    user_type : { type: String, enum: enumUserType, required: true },
    gender : { type: String, enum: enumGender },
    facebook_id : { type: String, required: false },
    google_id : { type: String, required: false },
    user: { type: ObjectId, index: true, required: false },
    address: { type: String, required: false },
    city: { type: String, required: false },
    postal_code: { type: String, required: false },
    hours_taught: { type: Number, required: false },
    rating: { type: Number, required: false },
    profile_picture: { type: String, required: false }
  }, {strict:true, collection: 'accounts' });

  // Export
  return mongoose.model('Accounts', Accounts);

};
