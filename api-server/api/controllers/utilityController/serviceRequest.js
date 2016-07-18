var util = require('util');
var u = require('underscore');
var promise = require('bluebird');
var sendgrid = require("sendgrid")("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");
var path = require('path');
var ejs = require('ejs');
var fs = require('fs');
var emailTemplate = fs.readFileSync(path.join(__dirname, '/../../../asset/templates/email/emailTemplate.ejs'), 'utf-8');

var logger = require('../../../logger');
var models = require('../../../models');
var helper = require('../../helpers');

var config = require('./config');

var sequelize = models.sequelize;

module.exports = {
    sendServiceRequest: sendServiceRequest
}


function sendServiceRequest(req, res) {
    function getData(carId) {
        return models.car.findOne({
            where: {id: carId},
            attributes:["car_year","car_make","car_model","car_engine","vin","mileage_total"],
            include: [
                {
                    // get the shop
                    model: models.car_shop,
                    attributes: ["id"],
                    required: true,
                    include: [{
                            model: models.shop,
                            required: true,
                            attributes: ["email"]
                        }
                    ]
                },{
                    // get the associated services
                    model: models.car_service,
                    required: false,
                    as: "issues",
                    where: {status: "new"},
                    attributes: ["status"],
                    include: [{
                            model: models.service_edmunds,
                            required: false,
                            attributes: ["item","action"]
                        },{
                            model: models.service_customized,
                            required: false,
                            attributes: ["item","action"]
                        },{
                            model: models.recall_recallmasters,
                            required: false,
                            attributes: [["name","item"]]
                        },{
                            model: models.dtc,
                            required: false,
                            attributes: [["dtc_code", "item"], "description"]
                        },{
                            model: models.service_archive,
                            required: false,
                            attributes: ["item", "description"]
                        }
                    ]
                }
            ]
        })
    }
    function getUserInfo(carId) {
        var carId = carId;
        return models.car.findOne({
            attributes: [
                ["id_user", "userId"]
            ],
            where: { id: carId }
        }).then(function(result) {
            if (result) {
                result = result.dataValues;
            }
            else {
                logger.info("no car detail found when sending service request for car %s", carId);
                result = promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
            }
            return result;
        }).then(function(result) {
            return models.user.findOne({
                attributes: [
                    ["id", "userId"],
                    ["name", "fullName"],
                    ["first_name", "firstName"],
                    ["last_name", "lastName"],
                    ["email", "email"],
                    ["phone_number", "phone"]
                ],
                where: {
                    id: result.userId
                }
            }).then(function(result) {
                if (result) {
                    result = result.dataValues;
                }
                else {
                    logger.info("no user detail found when sending service request for car %s", carId);
                    result = promise.reject(helper.makeError("TRANSACTION_ERROR", "internal service error"));
                }
                return result;
            })
        })
    }
    function getSenderInfo(userInfo) {
        // userInfo is guaranteed to exist in pre condition
        var sender = undefined;

        if (!!userInfo.fullName) {
            sender = userInfo.fullName;
        }
        else if (!!userInfo.firstName) {
            sender = userInfo.firstName;
        }
        else if (!!userInfo.email) {
            sender = userInfo.email;
        }
        else {
            sender = "no name";
        }

        logger.debug("sender of service request set to %s", sender);
        return {
            sender: sender,
            email: userInfo.email,
            phone: userInfo.phone
        };
    }
    function sendEmail (car, senderInfo, comments) {
        var message = undefined;
        if (u.isEmpty(car)) {
            message = util.format("detail of car %s not found", carId);
            logger.verbose(message);
            return promise.reject(helper.makeError("INVALID_INPUT", message));
        } else if (car.issues.length <= 0 && !config.serviceRequestOptions.allowEmptyRequest) {
            // no active services and allowEmptyRequest is false
            message = util.format("car %s has no active services", carId);
            logger.verbose(message);
            return promise.reject(helper.makeError("INVALID_INPUT", message));
        } else {
            return models.scanner.findOne({
                attributes: [
                    ["scanner_id", "scannerId"]
                ],
                where: {
                    id_car: carId
                }
            }).then(function(result) {
                var scannerId = (!!result) ? result.dataValues.scannerId : 0;
                var arrayOfServices = [];
                for (var i=0; i < car.issues.length; i++) {
                    var item,description,action;
                    var issue = car.issues[i];
                    // figure out what service it is
                    if (issue["service_edmunds"]) {
                        item = issue["service_edmunds"]["item"];
                        action = issue["service_edmunds"]["action"];
                    } else if (issue["service_customized"]) {
                        item = issue["service_customized"]["item"];
                        action = issue["service_customized"]["action"];
                    } else if (issue["recall_recallmasters"]) {
                        item = issue["recall_recallmasters"]["item"];
                    } else {
                        item = issue["dtc"]["item"];
                        description = issue["dtc"]["description"];
                    }

                    var toShow = "";
                    if (action)
                        toShow += action + "\n";
                    if (item)
                        toShow += item;
                    if (description)
                        toShow += "\n" + description;

                    arrayOfServices.push(toShow);
                }

                var emailHtml = ejs.render(emailTemplate,
                  {
                      senderInfo: senderInfo,
                      car: car,
                      arrayOfServices: arrayOfServices,
                      comments: comments,
                      scannerId: scannerId
                  });

                var receiver = car.car_shop.shop.email; // NOTE: uncomment to send email to actual shops
                // var receiver = "developers@getpitstop.io";
                var email = new sendgrid.Email();

                logger.debug("sending email to: %s, from: %s", receiver, senderInfo.email);
                email.addTo(receiver);
                email.setFrom(senderInfo.email);
                email.setSubject("Service Request from " + senderInfo.sender);
                email.setHtml(emailHtml);
                var sendEmail = promise.promisify(sendgrid.send, { context: sendgrid });

                return sendEmail(email).then(function(result) {
                    logger.verbose("email sent, server response: ", result);
                    res.json({"success": "email sent."});
                })
            })
        }
   }
    var params = req.swagger.params;
    var request = params.request.value;
    var carId = request.carId;
    var comments = request.comments;

    var promises = [
        getData(carId),
        getUserInfo(carId).then(function(result) { return getSenderInfo(result); })
    ];

    return promise.all(promises).spread(function(car, senderInfo) {
        return sendEmail(car, senderInfo, comments);
    }).catch(function(error) {
        if (!error.nonce) {
            logger.info("unexpected error when sending service request email for car %s:", carId);
            logger.info(error.stack);
            error = helper.makeError("TRANSACTION_ERROR", "internal service error");
        }

        helper.sendErrorResponse(res, error);
    })
}
