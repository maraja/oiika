var mongoose = require('mongoose');

module.exports = function() {

  var Subjects = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    name : { type: String, required: true },
    level : { type: String, required: true, trim: true }
  }, {strict:true, collection: 'subjects' });

  // Export
  return mongoose.model('Subjects', Subjects);

};
