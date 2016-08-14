const _ = require('underscore');

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
  	var enumGender = ['male', 'female'];

  	if (_.contains(enumGender, gender)) return gender && true;
  	else {
  		return gender && false;
  	}
  },

  latlong: function(coordinate) {
    if (
      (typeof coordinate === 'number' && coordinate <= 90 && coordinate >= -90) || 
      (coordinate === 999) ||
      (coordinate === -999)
    ){ return coordinate && true; }
    else { return coordinate && false }
  }

};