var config = require('config');
var result = config.get('apiConfig');
result.globalConfig = config.get('globalConfig');

module.exports = result

// console.log(result.authControllerConfig)
