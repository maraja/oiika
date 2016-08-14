const _ = require('underscore');

var enumGender = ['male', 'female'];
var enumUserType = ['tutor', 'tutee'];
var enumAccountType = ['local', 'facebook', 'google'];

module.exports = {

  length: function (i) {
    return function(str) {
      return str && str.length >= i;
    };
  },
  
  email: function (email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
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