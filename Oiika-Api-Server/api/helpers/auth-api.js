const config = require('../../config');

module.exports = {

	isKeyValid: (req) => {

		if (req.headers[config.api.api-key-name] === config.api.api-web-server-key) return true;
		else return false;

	}

}