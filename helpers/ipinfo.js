var config = require('../config');
var rp = require('request-promise');

module.exports.location = function(ip) {
  if(typeof ip === 'undefined' || ip == '') {
    if(config.environment == 'production') {
      ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    } else {
      ip = '107.170.7.163' //sample public IP
    }
  }

  return new Promise((resolve, reject) => {
    rp({
      uri: 'http://ipinfo.io/' + ip,
      method: "GET",
      json: true
    }).then(data => {
      if(typeof data.loc !== 'undefined') {
        resolve(data.loc);
      } else {
        resolve('');
      }
    }).catch(error => {
      resolve('');
    });
  });
}
