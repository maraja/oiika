var promise = require("bluebird");
var u = require('underscore');
var util = require('util');
var http = require('https');
var randomstring = require('randomstring');

var logger = require('../../logger');
var helper = require('../helpers');

// paths are set this way because as of right now, swagger does not support
// a way to hold routes for controllers in multiple different folders.
// It is required to put all the controllers in the same folder.
// Models and connection utilitiy are stored in mongo folder as seen below.
var mongoUtil = require( '../../mongo/api/mongoUtil' );
var installationModel = require('../../mongo/api/models/installation')();

// get the db connection.
var db = mongoUtil.getDb();

module.exports = {
    createInstallation: createInstallation
};

function createInstallation(req, res){
    var params = req.swagger.params;
    var installation = params.installation.value;
    var vals = {};

    // _id should not be entered.
    // if (installation._id){
    //     var err = new Error();
    //     err.name = "INVALID_INPUT";
    //     err.message = "_id is an auto-generated field and shouldn't be entered.";
    //     helper.sendErrorResponse(res, err);
    // }

    // empty document declaration for comparison later
    var empty_vals = { 
        android: {
            _id: '', 
            appName: '', 
            _updated_at: '', 
            appVersion: '', 
            installationId: '', 
            parseVersion: '', 
            _created_at: '', 
            appIdentifier: '', 
            deviceType: '', 
            localeIdentifier: '', 
            pushType: '', 
            timeZone: '', 
            deviceToken: ''
        },
        ios: {
            _id: '', 
            badge: '', 
            timeZone: '', 
            _created_at: '', 
            appVersion: '', 
            channels: [], 
            _updated_at: '', 
            deviceToken: '', 
            installationId: '', 
            parseVersion: '', 
            appIdentifier: '', 
            appName: '', 
            deviceType: ''
        }
    };

    validate().then(function(){
        populate();
    }).then(function(){
        doTransaction();
    });

    function validate(){
        return promise.try(function(){
            // this for each loop is O(n) as oppose to O(1) if each field is hard coded to check.
            // reason for this is for expandability. If there's ever a point in the future where
            // we want more fields not to be entered, just add it to here. Above is an example of
            // how this can be done singularly.
            // Note: this loop runs asynchronously. Handle appropriately!
            u.each(installation, function(value, key) {
                if ((key === "_id" || key === "_updated_at" || key === "_created_at") && installation[key] !== undefined){
                    var err = new Error();
                    err.name = "INVALID_INPUT";
                    err.message = key + " is an auto-generated field and shouldn't be entered.";
                    helper.sendErrorResponse(res, err);
                }
            });
        });
    };
    
    function populate() {
        return promise.try(function(){
            // loop through appropriate JSON structure.
            u.each(empty_vals[installation.deviceType], function(value, key) {
                switch (key){
                    case "_id":
                        break;
                    case "_updated_at":
                        vals[key] = new Date().toISOString();
                        break;
                    case "_created_at":
                        vals[key] = new Date().toISOString();
                        break;
                    default:
                        break;
                }

                if (installation[key] !== undefined){
                    vals[key] = installation[key];
                }
            });
        });
    };

    function doTransaction(){

        vals._id = randomstring.generate(10);

        var new_document = new installationModel(vals);

        new_document.save(function (err, new_document){
        	if (err){
                var errors = '';
                console.log(err);
                // catch input errors.
                if(err.name === "ValidationError"){
                    u.each(err.errors, function(value, key) {
                        errors += key + ". ";
                    });
                }
                // catch duplicate key.
                if(err.code === 11000){
                    // recurse until there is no id collision.
                    return doTransaction();
                }
                err.message = 'Invalid input for fields: ' + errors;
                helper.sendErrorResponse(res, err);
            } else {
        		res.json(new_document);
        	}
        });
    };
}
