let mongoose = require("mongoose");
const _ = require('underscore');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let tutor = server.models.tutorModel;
let should = chai.should();

chai.use(chaiHttp);
chai.use(require('chai-json-schema'));

const inputs = require('./helpers/tutors_input').inputs;
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
describe('Tutors', () => {
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

		it('should fail: tutorId is a number', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor.fail_1)
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId is an invalid string', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor.fail_2)
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: id does not exist', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor.fail_3)
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: invalid tutorId', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor.fail_4)
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: null tutorId', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor.fail_5)
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should GET a tutor', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor.pass_0)
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


	// REVIEWS

	describe('/GET tutor reviews', () => {

		it('should fail: tutorId is blank string - route should not exist', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_reviews.fail_0+'/reviews')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(404);
					done();
				});
		});

		it('should fail: tutorId is a number', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_reviews.fail_1+'/reviews')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId is an invalid string', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_reviews.fail_2+'/reviews')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: invalid tutor id', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_reviews.fail_3+'/reviews')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: null tutor id', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_reviews.fail_4+'/reviews')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should pass: blank reviews array', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_reviews.pass_0+'/reviews')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(res);
					res.body.should.be.an('array');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(200);
					done();
				});
		});

		it('should GET a tutor\'s reviews', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_reviews.pass_1+'/reviews')
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


	// SCHEDULE

	describe('/GET tutor schedule', () => {

		it('should fail: tutorId is blank string - route should not exist', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_schedule.fail_0+'/schedule')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(404);
					done();
				});
		});

		it('should fail: tutorId is a number', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_schedule.fail_1+'/schedule')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId is an invalid string', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_schedule.fail_2+'/schedule')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: invalid tutor id', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_schedule.fail_3+'/schedule')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId does not exist', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_schedule.fail_4+'/schedule')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: null tutorId', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_schedule.fail_5+'/schedule')
				.set('Accept', 'application/json')
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should GET a tutor\'s schedule', (done) => {
			chai.request(server)
				.get('/tutor/'+inputs.get_tutor_schedule.pass_0+'/schedule')
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


	describe('/PUT tutor schedule', () => {
		it('should fail: empty body', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_0.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId is a number', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_1.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId is an invalid string', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_2.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId does not exist in collection', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_3.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId is an invalid string', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_4.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: invalid time entered for Saturday', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_5.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: invalid time entered for Sunday', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_6.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: invalid time entered for Sunday', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_7.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: no tutorId entered', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_8.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: no schedule entered.', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_9.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: null tutorId and schedule', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_10.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: null schedule', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_11.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: null tutorId', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.fail_12.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should pass: update tutor schedule', (done) => {
			chai.request(server)
				.put('/tutor/update-schedule')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_schedule.pass_0.body)
				.end((err, res) => {
					should.not.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(200);
					done();
				});
		});
	});


	// LOCATION

	describe('/PUT tutor location', () => {

		it('should fail: empty body', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.fail_0.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId is a number', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.fail_1.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId is an invalid string', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.fail_2.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId does not exist in collection', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.fail_3.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: tutorId is an invalid string', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.fail_4.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: invalid lat lng entered', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.fail_5.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: invalid lng entered', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.fail_6.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: invalid lat entered', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.fail_7.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: no tutorId entered', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.fail_8.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should fail: no location entered.', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.fail_9.body)
				.end((err, res) => {
					should.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(400);
					done();
				});
		});

		it('should pass: update tutor location', (done) => {
			chai.request(server)
				.put('/tutor/update-location')
				.set('Accept', 'application/json')
				.send(inputs.put_tutor_location.pass_0.body)
				.end((err, res) => {
					should.not.exist(err);
					res.should.be.an('object');
					// res.body.should.be.jsonSchema(schemaGoesHere);
					res.should.have.status(200);
					done();
				});
		});

	});

});