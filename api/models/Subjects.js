var mongoose = require('mongoose');
var utils = require('../../mongo/mongoose-utils');

module.exports = function() {

  var Subjects = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    name : { type: String, index: true, required: true, lowercase: true, validate: [utils.validate.validString, 'invalid subject name entered.'] },
    level : { type: Number, required: true, trim: true, validate: [utils.validate.subject_level, 'invalid subject level entered.']}
  }, {strict:true, collection: 'subjects' });

  // Export
  return mongoose.model('Subjects', Subjects);

};
