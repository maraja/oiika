
const accountModel = app.models.accountModel;
const tuteeModel = app.models.tuteeModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const tutorStats = require('../../jobs/tutor-stats.js')

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {

  // POST REQUESTS
  updateTuteesFavourites: (req, res) => {
    var tuteeId = req.swagger.params.tutee.value.tuteeId;
    var tutorIds = req.swagger.params.tutee.value.tutorIds;

    let findAccount = () => {
      return new Promise((resolve, reject) => {

        accountModel.findOne({
          _id: tuteeId,
          user_type: 'tutee'
        }, (err, resultDocument) => {

          if(err) {
            return error.errorHandler(err, null, null, reject, res);
          } else if (!resultDocument) {
            return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, res);
          } else {
            return resolve(resultDocument);
          }

        });

      });
    }

    let findTutee = account => {
      return new Promise((resolve, reject) => {

        tuteeModel.findOne({
          tutee_id: tuteeId
        }, (err, resultDocument) => {

          if(err) {
            return error.errorHandler(err, null, null, reject, res);
          } else if (!resultDocument) {
            return error.errorHandler(null, "INVALID_ID", "ID does not exist.", reject, res);
          } else {
            resultDocument.favourites = tutorIds;
            resultDocument.save();
            
            return resolve();
          }

        });

      });
      
    };

    // begin promise chain
    // start by finding the tutor
    findAccount()
    .then(findTutee)
    // handle success accordingly
    .then(result => {
      return res.send(JSON.stringify({
        "message": "Successfully updated",
      }))
    })
    // catch all errors and handle accordingly
    .catch(err => { return error.sendError(err.name, err.message, res); });
  }

};