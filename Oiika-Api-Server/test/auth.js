let mongoose = require("mongoose");
// let Tutor = app.models.tutorModel;
// let Tutor = require('../api/models/Tutors')();
// let Account = app.models.accountModel;

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let tutor = server.models.tutorModel;
let should = chai.should();
// let expect = chai.expect;

chai.use(chaiHttp);
chai.use(require('chai-json-schema'));

// var fruitSchema = {
//   "title": "fresh fruit schema v1",
//   "type": "object",
//   "required": ["skin", "colors", "taste"],
//   "properties": {
//     "colors": {
//       "type": "array",
//       "minItems": 1,
//       "uniqueItems": true,
//       "items": {
//         "type": "string"
//       }
//     },
//     "skin": {
//       "type": "string"
//     },
//     "taste": {
//       "type": "number",
//       "minimum": 5
//     }
//   }
// };

//Our parent block
describe('Tutors', () => {
    // beforeEach((done) => { //Before each test we empty the database
    //     Book.remove({}, (err) => { 
    //        done();         
    //     });     
    // });

  /*
  * Test the /GET route
  */
  describe('/GET tutor', () => {
    it('should GET a tutor', (done) => {
      chai.request(server)
        .get('/tutor/57b65f7e14728a2c8eb57884')
        .set('Accept', 'application/json')
        .end((err, res) => {
          should.exist(res);
          should.not.exist(err);
          res.should.be.an('object');
          // res.body.should.be.jsonSchema(schemaGoesHere);
          res.should.have.status(200);
          done();
        });
    });
  });

});