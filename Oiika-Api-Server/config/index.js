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
};

config["secrets"] = {
    clientId: "LDcJK6KXGSn83O6Xb5wamtPDa4CnNleF",
    clientSecret: "lcdOTh-pDnmBOPLK-tTJxHOLXgcMRH_4e-VaDlmtdlMEGPd5e8PDX74CzOu08doP",
    jwt: {
        selfSigned: {
            key: "oiika12345",
            audience: "KyaaBCJ2QspvFoumR6K56w061ruZgnfk",
            issuer: "oiika"
        },
        auth0: {
            key: "oiika12345",
            audience: "5DGerMsizUkgASex0zeYU9a0jaiskpXP",
            issuer: "https://oiika.auth0.com/"
        }
    },
    mongoDBTestConnectionString: (config.db.dev.dialect + 
    	"://" + config.db.dev.username + 
    	":" + config.db.dev.password + 
    	"@" + config.db.dev.host + 
    	":" + config.db.dev.port + 
    	"/" + config.db.dev.database)
};

// Reference: http://stackoverflow.com/questions/21284766/regex-to-match-the-url-pattern-in-nodejs
// great explanation of regex in node.js
config["unauthenticated_paths"] = [
    // /\/tutor/i,
    ///\/login/i, // regex that matches all login paths
    /\/scan/i, // regex that matches all scan paths
    { url: '/user', methods: [ 'POST' ] }, // allow login
    { url: /\/tutor\/[^\/]+\/min$/, methods: [ 'GET'] } // allow tutor min profile
];

var environment = process.env.ENVIRONMENT || "dev";
config["environment"] = environment.toLowerCase();
config["port"] = process.env.PORT || 10010; // 10010 - default port
