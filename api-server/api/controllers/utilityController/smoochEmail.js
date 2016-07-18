
var SmoochCore = require('smooch-core');

var config = require('./config');
var logger = require('../../../logger');
var helper = require('../../helpers');

var smooch = new SmoochCore(config.smoochOptions);

var sendgrid  = require('sendgrid')(config.sendgridKey);


module.exports={
  sendSmoochEmail : sendSmoochEmail
};

function sendSmoochEmail (req, res) {
    var params = req.swagger.params;
    var request = params.request.value;
    smooch.conversations.get(request.appUser._id).then(function(response) {
        var user = request.appUser.givenName;
        var message = request.messages[0].text;
        var model = request.appUser.properties["Car Model"];
        var make = request.appUser.properties["Car Make"];
        var year = request.appUser.properties["Car Year"];
        var vin = request.appUser.properties["VIN"];
        var email = request.appUser.email;
        var phone = request.appUser.properties["Phone"];
        var text  = '<div marginwidth="0" marginheight="0" style="margin:0;padding:0;background-color:#dee0e2;min-height:100%;width:100%"><center><table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" style="border-collapse:collapse;margin:0;padding:0;background-color:#dee0e2;height:100%;width:100%"><tbody><tr><td align="center" valign="top" style="margin:0;padding:30px;height:100%;width:100%"><table border="0" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:white;border:1px solid #bbbbbb;border-collapse:separate"><tbody><tr><td align="center" valign="top"><table border="0" cellpadding="5" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:white;font-size:18px;font-family:Helvetica;border-bottom:1px solid #cccccc;word-wrap:break-word"><tbody><tr><td width="5%"><img src="https://ci3.googleusercontent.com/proxy/c9rSp12T8UhVvF1_IWeLbst6c8-nq2r4FZosg1AxaKfLR8hj3EFSpxgtLfZNsBzXwayBClOkbmJ505U3KennSiY9wQ76imSoLrTXyR0CxjiSk0ZroVR3Wf4tAje5eSeZhqZwe8EnKHy9SOw6E7_dVL3dU1KpQi6fny3yvFwpepNUkDVQkzBFZFG4QSEEw5X58NGH=s0-d-e1-ft#https://media.smooch.io/appicons/55d763f04f6984190075e75a.jpg?t=1441398259897&amp;t=1441398299929&amp;t=1442598860598&amp;t=1442599620757" style="border:0;line-height:100%;outline:none;text-decoration:none;width:30px;min-height:30px;padding-left:15px" class="CToWUd"></td><td width="95%" style="padding-top:15px;padding-bottom:15px;font-weight:lighter"><div style="padding-left:15px">New message from '+user+'</div></td></tr></tbody></table></td></tr><tr><td align="center" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:white;margin-left:0px;width:95%"><tbody><tr><td align="center" valign="top" style="max-width:280px;width:280px;background:white;color:black"><table border="0" cellpadding="20" cellspacing="0" width="100%" style="border-collapse:collapse"><tbody><tr><td style="color:black;font-family:Helvetica;text-align:left;line-height:150%;padding-top:0;padding-right:20px;padding-bottom:20px;padding-left:0px;font-size:12px"><table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;word-wrap:break-word"><tbody><tr><td><p style="font-size:14px;font-weight:lighter;margin-top:16px">PITSTOP</p></td></tr><tr><td colspan="2" style="padding-top:5px"><div style="border-radius:4px;padding:10px;color:white;font-size:12px;max-width:240px;font-weight:300;background:#00aeff">'+message+'</div></td></tr><tr><td colspan="2"><span style="font-size:14px">Add a message to this conversation by replying to this email.</span></td></tr></tbody></table></td></tr><tr><td valign="top" style="color:black;font-family:Helvetica;text-align:left;line-height:150%;padding-top:0;padding-right:20px;padding-bottom:20px;padding-left:0px;font-size:12px"></td></tr></tbody></table></td><td align="center" valign="top" style="max-width:280px;width:280px;background:white;color:black;padding-top:15px"><table border="0" cellpadding="20" cellspacing="0" width="100%" style="border-collapse:collapse"><tbody><tr><td style="color:black;font-family:Helvetica;padding-right:0px;line-height:150%;padding-top:0;padding-bottom:20px;text-align:left;padding-left:0px;font-size:12px"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tbody><tr><td valign="top" style="color:black;font-family:Helvetica;padding-right:0px;line-height:150%;padding-top:0;padding-bottom:20px;text-align:left;padding-left:0px;font-size:12px"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tbody><tr style="border-bottom:solid 1px #cccbcf"><td><h3 style="letter-spacing:normal;color:black;font-family:Helvetica;font-size:18px;font-weight:lighter;line-height:100%;display:block;margin-top:0;margin-right:0;margin-bottom:10px;margin-left:0;text-align:left">USER INFO</h3></td></tr><tr><td style="border-bottom:solid 1px #cccbcf;padding-bottom:8px;padding-top:8px">'+user+'</td></tr><tr><td style="border-bottom:solid 1px #cccbcf;padding-bottom:8px;padding-top:8px">'+model+' - ' +make + ' ( '+year + ' )</td></tr><tr><td style="border-bottom:solid 1px #cccbcf;padding-bottom:8px;padding-top:8px">'+vin+'</td></tr></tbody></table></td></tr><tr><td valign="top" style="font-family:Helvetica;color:black;padding-right:0px;font-size:12px;line-height:150%;padding-bottom:20px;text-align:left;padding-left:0px;padding-top:14px"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tbody><tr><td><h3 style="letter-spacing:normal;color:black;font-family:Helvetica;font-size:18px;font-weight:lighter;line-height:100%;display:block;margin-top:0;margin-right:0;margin-bottom:10px;margin-left:0;text-align:left">More Info</h3></td></tr><tr><td width="100%" style="border-bottom:solid 1px #cccbcf;padding-bottom:8px;padding-top:8px"><div>Email</div><div style="font-weight:bold"><a href="mailto:'+email+'" target="_blank">'+email+'</a></div></td></tr><tr><td width="100%" style="border-bottom:solid 1px #cccbcf;padding-bottom:8px;padding-top:8px"><div>Phone</div><div style="font-weight:bold"><a href="tel:'+phone+'" value="+'+phone+'" target="_blank">'+phone+'</a></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align="center" valign="top" colspan="2"><table border="0" cellpadding="3" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:white;padding-bottom:8px;text-align:right;font-family:Helvetica;color:#cccbcf;font-size:10px;padding-top:8px;border-top:1px solid #cccbcf"><tbody><tr><td width="5%" style="padding-top:10px;padding-bottom:10px;vertical-align:middle"><img src="http://letabc.xyz:3000/logo.png" width="129" style="border:0;line-height:100%;outline:none;text-decoration:none;margin-right:10px;min-height:25px" class="CToWUd"></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></center></div>'
        logger.debug("sending smooch email with message: ", message);
        sendgrid.send({
          to:       request.appUser.properties.Email,
          from:     response.conversation._id+"@mail.smooch.io",
          subject:  '[PITSTOP] Message from ' + request.appUser.givenName,
          html:     text
        }, function(err, json) {
            // NOTE: promise chain is broken
          if (err) {
            logger.info("email not sent, server response:");
            logger.info(err);
            var error = new Error();
            error.nonce = true;
            error.name = "TRANSACTION_ERROR";
            error.message = "email not sent: internal service error";
            helper.sendErrorResponse(res, error);
            return;
          }
          res.send({"success":"email sent for smooch"});
        });
    }, function(error) {
        logger.info("cannot get smooch conversation");
        if (typeof(error.stack) !== "undefined") {
            logger.info(error.stack);
        }
        else {
            logger.info(error);
        }
        var error = new Error();
        error.nonce = true;
        error.name = "TRANSACTION_ERROR";
        error.message = "email not sent: internal service error";
        helper.sendErrorResponse(res, error);
    });
}
