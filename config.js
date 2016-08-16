//load the corrent config file development on NODE_ENV
var env = process.env.NODE_ENV || 'development';

var config = require(`./config/config.${env}.js`);
if (!config) {
    console.error(`Configuration file config.${env}.js not found.`);
    process.exit();
}

config.environment = env;

console.log('Using ' + env);

module.exports = config;
