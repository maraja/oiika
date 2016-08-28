const _ = require('underscore');

module.exports = {
	isValidString: isValidString
}

function isValidString(input){
	let re = /[-\/\\^$*+?.()|[\]{}]/g;
	return input.match(re);
}