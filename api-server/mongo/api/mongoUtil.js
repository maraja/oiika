'use strict';

var mongoose = require('mongoose');
var _db;

var config = require('./config')
//
// var u         = require('underscore');
// var fs        = require('fs');
// var path      = require('path');
// var Sequelize = require('sequelize');
// var env       = config.globalConfig.environment;
// var dbConfig    = config.globalConfig.db[env].userData;
// var options   = {
//     logging: false
// };

module.exports = {
    connectToServer: connectToServer,
    getDb: getDb
};

function connectToServer() {
    var connString = 'mongodb://' + dbConfig.username + ':' + dbConfig.password
                    + '@' + dbConfig.domain + ':' + dbConfig.port
                    + '/' + dbConfig.databaseName;

    mongoose.connect(connString, function(err) {
        if (err) throw err;
    });
    var db = mongoose.connection;
    // db.on('error', function callback(){
    // 	var err = new Error();
 //        err.name = "CONNECTION_ERROR";
 //        err.message = "Mongo db connection error failed.";
 //        throw(err);
    // });
    db.once('open', function callback () {
        _db = db;
        // installation.findOne({
        // 	deviceToken: "APA91bG3CJAQbOBR7p4qY_bkovbtO13XF-c8LzXdETPDvy11FLigj8rrv8_OjRPgewhlauYS47fd3a4n_MR4Ovg4ygYVebkz4eEUI5yA1Tn4lRjol1WcytY"
        // }, function(err, output){
  //         if (err){ console.log(err); }
  //       });
        return;
    });
}

function getDb() {
    return _db;
}
