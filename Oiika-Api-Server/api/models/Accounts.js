var mongoose = require('mongoose');
var utils = require('../../mongo/mongoose-utils');

module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;

  var Accounts = new mongoose.Schema({

    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    first_name : { type: String, required: true, validate: [utils.validate.length(2), 'first name must be at least 2 characters long.'] },
    last_name : { type: String, required: true, validate: [utils.validate.length(2), 'last name must be at least 2 characters long.'] },
    email : { type: String, required: true, lowercase: true, index: true, unique: true, trim: true, validate: [utils.validate.email, 'invalid email entered.'] },
    password : { type: String, required: false },
    account_type : { type: String, required: false, validate: [utils.validate.account, 'invalid account type.'] },
    user_type : { type: String, required: true, validate: [utils.validate.user, 'invalid user type.'] },
    gender : { type: String, required: false, validate: [utils.validate.gender, 'invalid gender.']},
    // gender : { type: String, validate: [utils.validate.gender, 'not a valid gender']},
    facebook_id : { type: String, required: false },
    google_id : { type: String, required: false },
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
