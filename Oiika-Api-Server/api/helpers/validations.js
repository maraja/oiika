const _ = require('underscore');

module.exports = {
	validate: validate
}

// function to route validations to appropriate validator functions.
// call this function whenever validation is required.
function validate(name, value, errors, isRequired){
	if(value){
		switch (name){
			case "first_name":
				return isFirstNameValid(value, errors, isRequired);
				break;
			case "last_name":
				return isLastNameValid(value, errors, isRequired);
				break;
			case "password":
				return isPasswordValid(value, errors, isRequired);
				break;
			case "gender":
				return isGenderValid(value, errors, isRequired);
				break;
			case "short_description":
				return isShortDescriptionValid(value, errors, isRequired);
				break;
			case "full_description":
				return isFullDescriptionValid(value, errors, isRequired);
				break;
			case "user_type":
				return isUserTypeValid(value, errors, isRequired);
				break;
			case "tutor_email":
			case "tutee_email":
			case "email":
				return isEmailValid(value, errors, isRequired);
				break;
			case "facebook_id":
				return isFacebookIdValid(value, errors, isRequired);
				break;
			case "google_id":
				return isGoogleIdValid(value, errors, isRequired);
				break;
			case "profile_picture":
				return isProfilePictureValid(value, errors, isRequired);
				break;
			case "datetime":
				return isDatetimeValid(value, errors, isRequired);
				break;
			case "city":
				return isCityValid(value, errors, isRequired);
				break;
			case "subject":
				return isSubjectValid(value, errors, isRequired);
				break;
			case "hourly_rate":
				return isRateValid(value, errors, isRequired);
				break;
			case "rating":
				return isRatingValid(value, errors, isRequired);
				break;
			case "duration":
				return isDurationValid(value, errors, isRequired);
				break;
			case "location_lat":
			case "location_lng":
				return isLocationValid(value, errors, isRequired);
				break;
			case "travel_distance":
				return isTravelDistanceValid(value, errors, isRequired);
				break;
			default:
				return false;
				break;
		}
	} else if (isRequired) { 
		errors.push("No "+name+" Entered.");
		return false; 
	} else {
		return false;
	}
}


// FIRST NAME
function isFirstNameValid(name, errors, isRequired){

		const minLength = 2;
		const maxLength = 15;

		if (name.trim().length >= minLength && name.trim().length <= maxLength) return true;
		else {
			errors.push("Invalid First Name Entered.");
			return false;
		}

}


// LAST NAME
function isLastNameValid(name, errors, isRequired){

		const minLength = 2;
		const maxLength = 15;

		if (name.trim().length >= minLength && name.trim().length <= maxLength) return true;
		else {
			errors.push("Invalid Last Name Entered.");
			return false;
		}

}


// PASSWORD
function isPasswordValid(password, errors, isRequired){

		const minLength = 2;
		const maxLength = 15;

		if (password.trim().length >= minLength && password.trim().length <= maxLength) return true;
		else {
			errors.push("Invalid Password Entered.");
			return false;
		}

}


// GENDER
function isGenderValid(gender, errors, isRequired){

		var enumGender = ['male', 'female'];

		if (_.contains(enumGender, gender)) return true;
		else {
			errors.push("Invalid Gender Entered.");
			return false;
		}

}


// SHORT DESCRIPTION
function isShortDescriptionValid(shortDesc, errors, isRequired){

		const minLength = 1;
		const maxLength = 140;

		if (shortDesc.trim().length >= minLength && shortDesc.trim().length <= maxLength) return true;
		else {
			errors.push("Invalid Short Description Entered.");
			return false;
		}

}


// SHORT DESCRIPTION
function isFullDescriptionValid(fullDesc, errors, isRequired){

		const minLength = 1;
		const maxLength = 1000;

		if (fullDesc.trim().length >= minLength && fullDesc.trim().length <= maxLength) return true;
		else {
			errors.push("Invalid Full Description Entered.");
			return false;
		}

}


// USER TYPE
function isUserTypeValid(userType, errors, isRequired){

		var enumUserType = ['tutor', 'tutee'];

		if (_.contains(enumUserType, userType)) return true;
		else {
			errors.push("Invalid User type Entered.");
			return false;
		}

}


// EMAIL
function isEmailValid(email, errors, isRequired){

		var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if(re.test(email)){
			return true;
		} else {
			errors.push("Invalid Email Entered.");
			return false;
		}

}


// DATETIME
function isDatetimeValid(datetime, errors, isRequired){

	// Date format: mm-dd-yyyy hh:mm am|pm

		var re = /^(((0[13578]|1[02])[-](0[1-9]|[12]\d|3[01])[-]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((0[13456789]|1[012])[-](0[1-9]|[12]\d|30)[-]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((02)[-](0[1-9]|1\d|2[0-8])[-]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((02)[-](29)[-]((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm)))$/g;
		if(re.test(datetime)){
			return true;
		} else {
			errors.push("Invalid Date-Time Entered.");
			return false;
		}

}


// CITY
function isCityValid(city, errors, isRequired){

		const minLength = 2;
		const maxLength = 15;

		if (city.trim().length >= minLength && city.trim().length <= maxLength) return true;
		else {
			errors.push("Invalid City Entered.");
			return false;
		}
}


// HOURLY RATE
function isRateValid(rate, errors, isRequired){

		const minRate = 10;
		const maxRate = 100;

		if (rate >= minRate && rate <= maxRate) return true;
		else {
			errors.push("Invalid Rate Entered.");
			return false;
		}

}

 
// RATING
function isRatingValid(rating, errors, isRequired){

		const minRating = 0;
		const maxRating = 5;

		if (rating >= minRating && rating <= maxRating) return true;
		else {
			errors.push("Invalid Rating Entered.");
			return false;
		}

}


// SESSION DURATION
function isDurationValid(duration, errors, isRequired){

		const minDuration = 0.5;
		const maxDuration = 12;

		if (duration >= minDuration && rate <= maxDuration) return true;
		else {
			errors.push("Invalid Duration Entered.");
			return false;
		}

}


// SUBJECT
function isSubjectValid(subject, errors, isRequired){

		const minLength = 2;
		const maxLength = 15;

		if (subject.trim().length >= minLength && subject.trim().length <= maxLength) return true;
		else {
			errors.push("Invalid Subject Entered.");
			return false;
		}
}


// LOCATION
function isLocationValid(location, errors, isRequired){
	return true;
}


// TRAVEL
function isTravelDistanceValid(distance, errors, isRequired){
	return true;
}

// FACEBOOK ID
function isFacebookIdValid(id, errors, isRequired){
	return true;
}

// GOOGLE ID
function isGoogleIdValid(id, errors, isRequired){
	return true;
}

// PROFILE PICTURE
function isProfilePictureValid(pic, errors, isRequired){
	return true;
}