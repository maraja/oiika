var serviceRequest = require ('./serviceRequest');
var serviceUpdate = require ('./serviceUpdate');
var recallMasters = require('./recallMasters');
var edmunds = require('./edmunds');
var smoochEmail = require('./smoochEmail');

module.exports = {
    serviceRequest: serviceRequest,
    serviceUpdate: serviceUpdate,
    recallMasters: recallMasters,
    edmunds: edmunds,
    smoochEmail : smoochEmail,
};
