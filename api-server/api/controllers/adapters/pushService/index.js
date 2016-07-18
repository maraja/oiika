let u = require('lodash');
let promise = require('bluebird');
let util = require('util');
let config = require('./config');

let dependency = require('./dependency');

let logger = dependency.logger;
let models = dependency.models;
let helper = dependency.helpers;
let Parse = dependency.Parse;

function sendNotification(options) {
    function getRecipients(options) {
        function getRecipientsByUserId(userId) {
            return models.user_installation.findAll({
                attributes: [
                    ["installation_id", "installationId"]
                ],
                where: {
                    id_user: userId
                }
            }).then(function(result) {
                if (!result) {
                    result = [];
                } else {
                    result = u.map(result, function(item) {
                        return item.dataValues.installationId;
                    });
                }
                // remove empty items
                result = u.filter(result, function(item) {
                    return (!!item);
                });

                logger.verbose("# of devices found for user %s: %s", userId, result.length);
                return result;
            })
        }

        var result;

        if (options.recipients) {
            result = promise.resolve(options.recipients);
        } else {
            logger.info("getting recipients for push message for user %s", options.userId);
            result = getRecipientsByUserId(options.userId);
        }

        return result;
    }
    //it will save the notificaiton on parse to trigger parse to send push notificaiton
    // TODO: validations

    logger.verbose("push notification request starts, payload: %s", JSON.stringify(options));

    var name = options.name;
    var data = options.data;
    var recipients = options.recipients;
    var payload = dependency.templates.pushNotification.getPushMessage(name, data);

    return getRecipients(options).then(function(recipients) {
        options.recipients = recipients;

        logger.info("sending notification to %s devices", recipients.length);

        //set notifications object
        var Notification = Parse.Object.extend("Notification");
        var notificationObject = new Notification();

        notificationObject.set("content", payload.content);
        notificationObject.set("title", payload.title);
        notificationObject.set("recipients", recipients);

        return notificationObject.save().then(function(notificationObject) {
            logger.info("notification %s requested", notificationObject.id);
        }).then(null, function(error) {
            logger.info("error when sending notification");
            logger.info(error.stack);
        })
    })
}

module.exports = {
    sendNotification: sendNotification
}
