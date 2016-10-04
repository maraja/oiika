var mongoose = require('mongoose');

module.exports = function() {

  var TutorReviews = new mongoose.Schema({
    // first_name : { type: String, required:true, index: true, lowercase: true, trim:true, unique: true, validate: [util.validate.email, 'not valid'] },
    tutor_id: { type: String, required: true },
    tutee_id: { type: String, required: true },
    subject_id: { type: String, required: true },
    datetime: { type: Date, required: true },
    rating: { type: Number, required: true },
    review: { type: String, required: false }
  }, {strict:true, collection: 'tutor_reviews' });

  // Export
  return mongoose.model('SeTutorReviewsssions', TutorReviews);

};
