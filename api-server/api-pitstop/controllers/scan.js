var scans = require('./scanController');

var savePids = scans.pid.savePids;
var saveFreezeData = scans.freezeData.saveFreezeData;


module.exports = {
    savePids: savePids,
    createTrip: scans.trip.createTrip,
    updateTrip: scans.trip.updateTrip,
    getTripById: scans.trip.getTrip.byId,
    getTripByQuery: scans.trip.getTrip.byQuery,
    saveFreezeData: saveFreezeData
};
