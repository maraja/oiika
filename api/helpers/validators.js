const _ = require('underscore');
const Promise = require('bluebird');
const regexHelper = require('./regex');

const enumGender = ['male', 'female'];
const enumUserType = ['tutor', 'tutee'];
const enumAccountType = ['local', 'facebook', 'google'];
const enumSessionState = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
const enumAvailable = ['in_person', 'online'];

module.exports = {

	validString: function(input) {
		if(typeof input === 'string'){
			return input && !regexHelper.isValidString(input);
		} else {
			// array
			return input && true;
		}
	},

	length: function (i) {
		return function(str) {
			return str && str.length >= i;
		};
	},
	
	email: function (email) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		email = email.toLowerCase();
		return email && email.match(re) !== null;
	},

	// used to validate hours_worked, students_taught and num_of_reviews
	tutorStats: function (stat) {
		// console.log(stat)
		if(stat >= 0) return true;
		else return false;
	},

	gender: function(gender) {
	 if (_.contains(enumGender, gender)) return gender && true;
	 else {
			return gender && false;
	 }
	},

	user: function(user) {
		if (_.contains(enumUserType, user)) return user && true;
		else {
			return user && false;
		}
	},

	account: function(account) {
		if (_.contains(enumAccountType, account)) return account && true;
		else {
			return account && false;
		}
	},

	sessionState: function(state) {
		if (_.contains(enumSessionState, state)) return state && true;
		else {
			return state && false;
		}
	},

	available: function(available) {

		let isValid = false;

		_.each(available, (element, index) => {
			if (_.contains(enumAvailable, element)) {
				isValid = true;
			}
		})
		
		if (isValid) return available && true;
		else return available && false
	},

	duration: function(duration) {
		return duration && duration % 1 === 0;
	},

	date: function(date) {
		// Date format: mm-dd-yyyy hh:mm am|pm
		var re = /^(((0[13578]|1[02])[-](0[1-9]|[12]\d|3[01])[-]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((0[13456789]|1[012])[-](0[1-9]|[12]\d|30)[-]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((02)[-](0[1-9]|1\d|2[0-8])[-]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((02)[-](29)[-]((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm)))$/g;
		return date && date.match(re) !== null;
	},

	schedule_time: function(time) {
		var re = /^([01]\d|2[0-3]):?([0-5]\d)$/;

		// if(time.length==0) {time.push("-1");}
		if (typeof time === 'string') {
			// check each individual value
			return time && time.match(re) !== null;
		} else {
			// this method works -- not sure why?
			// return time && true;

			// the following commented code also works and is the logical way of doing it!
			var isValid = true;
			var map = [];
			
			_.each(time, function(element, content){

				map.push(new Promise(function(resolve, reject) {

					isValid = (element.match(re) ? true : false );

					return resolve();

				}))
			});

			// run through the array to check all values
			Promise.all(map)
			.then(function(){
				return (isValid ? time && true : time && false);
			})
		}
	},

	sessionTime: function(time) {
		var re = /^([01]\d|2[0-3]):?([0-5]\d)$/;

		// the following commented code also works and is the logical way of doing it!
		var isValid = true;
		var map = [];
		
		_.each(time, function(element, content){

			map.push(new Promise(function(resolve, reject) {

				isValid = (element.match(re) ? true : false );

				return resolve();

			}))
		});

		// run through the array to check all values
		Promise.all(map)
		.then(function(){
			if(isValid) return time && true
			else return time && false
			// return (isValid ? time && true : time && false);
		})
	},

	time: function(time){
		var re = /^([01]\d|2[0-3]):?([0-5]\d)$/;
		return time && time.match(re) !== null;
	},

	lat: function(coordinate) {
		if (
			(typeof coordinate === 'number' && coordinate <= 90 && coordinate >= -90) || 
			(coordinate === 999) ||
			(coordinate === -999)
		){ return coordinate && true; }
		else { return coordinate && false }
	},

	lng: function(coordinate) {
		if (
			(typeof coordinate === 'number' && coordinate <= 180 && coordinate >= -180) || 
			(coordinate === 999) ||
			(coordinate === -999)
		){ return coordinate && true; }
		else { return coordinate && false }
	},

	subject_level: function(level) {
		return level && level > 0;
	}

};