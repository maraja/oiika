const _ = require('underscore');

const enumGender = ['male', 'female'];
const enumUserType = ['tutor', 'tutee'];
const enumAccountType = ['local', 'facebook', 'google'];

module.exports = {

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

  duration: function(duration) {
    return duration && duration % 1 === 0;
  },

  date: function(date) {
    // Date format: mm-dd-yyyy hh:mm am|pm
    var re = /^(((0[13578]|1[02])[-](0[1-9]|[12]\d|3[01])[-]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((0[13456789]|1[012])[-](0[1-9]|[12]\d|30)[-]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((02)[-](0[1-9]|1\d|2[0-8])[-]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((02)[-](29)[-]((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm)))$/g;
    return date && date.match(re) !== null;
  },

  time: function(time) {
    console.log(time);
    var re = /^([01]\d|2[0-3]):?([0-5]\d)$/;

    // if(time.length==0) {time.push("-1");}
    return time && true;
    // return time && time.match(re) !== null;
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
  }

};