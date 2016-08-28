var mongoose = require('mongoose');
var utils = require('../../mongo/mongoose-utils');

module.exports = function() {

  var Skills = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    name : { type: String, index: true, unique: true, required: true, lowercase: true, validate: [utils.validate.validString, 'invalid skill entered.'] },
    subskills: { type: [String], required: false, lowercase: true, validate: [utils.validate.validString, 'invalid subskill name entered.'] }
  }, {strict:true, collection: 'skills' });

  // Export
  return mongoose.model('Skills', Skills);

};
