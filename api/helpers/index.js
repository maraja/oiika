const _ = require('underscore');
const moment = require('moment');

module.exports = {
    convertDateToHumanReadable: convertDateToHumanReadable
}

function convertDateToHumanReadable(date){
    return moment.utc(date).toDate().toString();
}

