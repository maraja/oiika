var mongoose = require('mongoose');

module.exports = function() {

  var Tutors = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    first_name : { type: String, required: true, lowercase: true, trim: true },
    last_name : { type: String, required:true, lowercase: true, trim: true },
    email : { type: String, required:true, lowercase: true, trim: true }
  }, {strict:true, collection: 'tutors' });

  // Export
  return mongoose.model('Tutors', Tutors);

};