const config = require('../../config');
const Promise = require('bluebird');
const error = require('../helpers/errors');

module.exports = {

	isKeyValid: (req) => {

		return new Promise((resolve, reject) => {

			if (req.headers[config.api['api-key-name']] && 
				req.headers[config.api['api-key-name']] === config.api['api-web-server-key']) return resolve();
			else return error.errorHandler(err, "INVALID_API_KEY", "Invalid API key provided.", reject, null);

		});
	}

}