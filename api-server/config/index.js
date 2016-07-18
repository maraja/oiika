var config = {};

module.exports = config;

config["db"] = {
    "dev": {
        "username": "oiika",
        "password": "oiikadoceo",
        "database": "oiika",
        "host": "thehotspot.ca",
        "port": 27017,
        "dialect": "mongodb"
    }
}

var environment = process.env.ENVIRONMENT || "dev";
config["environment"] = environment.toLowerCase();
config["port"] = process.env.PORT || 10010; // 10010 - default port
