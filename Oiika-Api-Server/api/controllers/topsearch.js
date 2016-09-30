
const accountModel = app.models.accountModel;
const tutorModel = app.models.tutorModel;
const subjectModel = app.models.subjectModel;
const skillModel = app.models.skillModel;
const valid = require('../helpers/validations');
const error = require('../helpers/errors');

const tutorStats = require('../../jobs/tutor-stats.js')

const Promise = require('bluebird');
// const mongoose = require('mongoose');
const _ = require('underscore');

module.exports = {

  // GET REQUESTS
  getAllByName: (req, res) => {
    let name = req.swagger.params.name.value;

    // escape entered string
    let regexName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '');
    regexName = new RegExp(regexName, "gi");

    if (name.length >= 2) {
      let findTutorAccounts = () => {
        return new Promise((resolve, reject) => {
          var result = [];
          
          result.tutors = [];

          accountModel.find({
            $and: [
              {
                $or: [
                  { first_name: regexName },
                  { last_name: regexName }
                ]
              },
              {
                user_type: 'tutor'
              }
            ]
          }, function(err, resultDocument) {

            if(!err && resultDocument.length!==0) {

              _.each(resultDocument, function(account) {
                result.tutors.push({ 
                  id: account._id,
                  first_name: account.first_name,
                  last_name: account.last_name,
                  profile_picture: account.profile_picture,
                });
              });

              return resolve(result);
            } else {
              return resolve(result);
            }
          });

        });
      }

      let findTutors = result => {
        return new Promise((resolve, reject) => {
          var tutorIds = [];
          var verified = [];

          verified.tutors = [];

          _.each(result.tutors, function(account) {
            tutorIds.push({tutor_id: account.id});
          });

          tutorModel.find({
            $or: tutorIds
          }, function(err, resultDocument) {
            
            if (!err && resultDocument && resultDocument.length!==0) {

              _.each(result.tutors, function(account) {

                _.each(resultDocument, function(tutor) {
                  if (account.id.toString()===tutor.tutor_id.toString()) {
                    verified.tutors.push({
                      id: account.id,
                      first_name: account.first_name,
                      last_name: account.last_name,
                      profile_picture: account.profile_picture,
                      currentLocation: tutor.currentLocation,
                      subjects: tutor.subjects,
                      skills: tutor.skills
                    });
                  }
                });

              });

              return resolve(verified);
            } else {
              return resolve(verified);
            }
          });

        });
      }

      let findSubjects = result => {
        return new Promise((resolve, reject) => {
          result.subjects = [];

          subjectModel.find({ name: regexName }, function(err, resultDocument) {

            if (!err && resultDocument && resultDocument.length!==0) {

              _.each(resultDocument, function(subject) {
                result.subjects.push({ 
                  id: subject._id,
                  name: subject.name,
                  level: subject.level,
                });
              });

              return resolve(result);
            } else {
              return resolve(result);
            }
          });

        });
      } 

      let findSkills = result => {
        return new Promise((resolve, reject) => {
          result.skills = [];

          skillModel.find({ name: regexName }, function(err, resultDocument) {

            if (!err && resultDocument && resultDocument.length!==0) {

              _.each(resultDocument, function(skill) {
                result.skills.push({ 
                  id: skill._id,
                  name: skill.name,
                });
              });

              return resolve(result);
            } else {
              return resolve(result);
            }
          });

        });
      } 

      // begin promise chain
      // start by finding the tutors
      findTutorAccounts()
      .then(findTutors)
      .then(findSubjects)
      .then(findSkills)
      // handle success accordingly
      .then(result => {
        return res.send(JSON.stringify({
          "message": "Successfully received",
          "tutors": result.tutors,
          "subjects": result.subjects,
          "skills": result.skills
        }))
      })
      // catch all errors and handle accordingly
      .catch(err => { return error.sendError(err.name, err.message, res); });
    } else {
      return error.errorHandler(null, "INVALID_SEARCH", "Search string must be at least 2 letters long.", null, res);
    }
  }
};