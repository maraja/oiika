module.exports = {
	isFirstNameValid: isFirstNameValid,
	isLastNameValid: isLastNameValid,
	isEmailValid: isEmailValid,
	isCityValid: isCityValid,
	isRateValid: isRateValid,
	validate: validate
}

function validate(name, value, errors){
	switch (name){
		case "first_name":
			return isFirstNameValid(value, errors);
			break;
		case "last_name":
			return isLastNameValid(value, errors);
			break;
		case "email":
			return isEmailValid(value, errors);
			break;
		case "city":
			return isCityValid(value, errors);
			break;
		case "hourly_rate":
			return isRateValid(value, errors);
			break;
		default:
			return false;
			break;
	}
}

function isFirstNameValid(name, errors){

	if(name){
		const minLength = 2;
		const maxLength = 15;

		if (name.trim().length >= minLength && name.trim().length <= maxLength) return true;
		else {
			errors.push("Invalid First Name Entered.");
			return false;
		}
	} else {
		errors.push("No First Name Entered.");
		return false;
	}

}

function isLastNameValid(name, errors){

	if(name){
		const minLength = 2;
		const maxLength = 15;

		if (name.trim().length >= minLength && name.trim().length <= maxLength) return true;
		else {
			errors.push("Invalid Last Name Entered.");
			return false;
		}
	} else {
		errors.push("No Last Name Entered.");
		return false;
	}

}

function isEmailValid(email, errors){

	if(email){
		var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if(re.test(email)){
			return true;
		} else {
			errors.push("Invalid Email Entered.");
			return false;
		}
	} else {
		errors.push("No Email Entered.");
		return false;
	}

}

function isCityValid(city, errors){

	if(city){
		const minLength = 2;
		const maxLength = 15;

		if (city.trim().length >= minLength && city.trim().length <= maxLength) return true;
		else {
			errors.push("Invalid City Entered.");
			return false;
		}
	} else {
		errors.push("No City Entered.");
		return false;
	}
}

function isRateValid(rate, errors){

	if(rate){
		const minRate = 10;
		const maxRate = 100;

		if (rate >= minRate && rate <= maxRate) return true;
		else {
			errors.push("Invalid Rate Entered.");
			return false;
		}
	} else {
		errors.push("No Rate Entered.");
		return false;
	}

}