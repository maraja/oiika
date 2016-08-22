let mongoose = require("mongoose");
const _ = require('underscore');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let tutor = server.models.accountModel;
let should = chai.should();

chai.use(chaiHttp);
chai.use(require('chai-json-schema'));

const inputs = require('./helpers/auth_input').inputs;
// console.log(inputs);

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
describe('Auth', () => {
		// beforeEach((done) => { //Before each test we empty the database
		//     Book.remove({}, (err) => { 
		//        done();         
		//     });     
		// });


	// for each loop for future implementation if needed.
	// _.each(inputs.get_tutor, function(element, content){

	//         fields_to_insert[fields[content]] = signup[content];
	//         resolve();

	// });


	// GET REQUESTS
	describe('/GET tutor', () => {

		it('should fail: tutorId is blank string - route should not exist', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor.fail_0)
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(404);
					done();
				});
		});

	});

});