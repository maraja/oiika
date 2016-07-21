var mongoose = require('mongoose');
var util = require('mongoose-util');


module.exports = function() {

  var ObjectId = mongoose.Schema.ObjectId;
  
  var enumDeviceType = ['ios', 'android'];
  var enumAppName = ['Pitstop', 'pitstop'];
  var enumAppId = ['com.pitstop', 'pitstop.ansik.ios'];
  var enumLocaleId = ['en-CA', 'en-US'];
  var enumPushType = ['gcm'];
  
  var Installation = new mongoose.Schema({

    // android & ios
    _id: {type: String, index: true, unique: true, required: true, minLength: 10, maxLength: 10},
    pushType: {type: String, trim:true},
    appName: {type: String, required: true, enum: enumAppName, trim: true},
    appVersion: {type: String, trim: true},
    installationId: {type: String, required: true, trim: true},
    parseVersion: {type: String, trim: true},
    appIdentifier: {type: String, required: true, enum: enumAppId, trim: true},
    deviceType: {type: String, required: true, enum: enumDeviceType, trim: true},
    localeIdentifier: {type: String, /*enum: enumLocaleId, */trim: true},
    pushType: {type: String, enum: enumPushType, trim: true},
    timeZone: {type: String, required: true, trim: true},
    deviceToken: {type: String, required: true, trim: true},

    // ios only
    channels: [{type: String, trim: true}],
    badge: {type: Number}

  }, {strict:true, collection: '_Installation'});

  // Export
  return mongoose.model('Installation', Installation);

};