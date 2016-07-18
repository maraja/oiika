var u = require('underscore');

var promise = require('bluebird');
var isJSON = require('is-json');
var helper = require('../helpers');
var request = require('request');
var util = require('util');
var logger = require('../../logger');
var models = require('../../models');
var sequelize = models.sequelize;
var encrypt = require('../helpers/password');
var config = require('./config')
var ParseModels = require('../models/mongoose');
var sendgrid = require("sendgrid")(config.sendgridApiKey);
var path = require('path');
var pushAdapter = require(path.join(
    config.globalConfig.paths.basePath, 'api', 'controllers', 'adapters', 'pushService'
))


module.exports = {
    getUserById: getUserById,
    getUserByIdMain: getUserByIdMain,
    createUser: createUser,
    createUserWithUserInfo: createUserWithUserInfo,
    updateUser: updateUser,
    updateUserSettings: updateUserSettings,
    updateUserSettingsMain: updateUserSettingsMain
};

function updateUserSettingsMain(userId, updatedSettings) {
    // NOTE: currently just update settings with the whole json,
    // it can be optimized by updating / adding / deleting related setting entries
    function doTransaction() {
        return sequelize.transaction(function(t) {
            return models.settings.upsert(
                {
                    "settings": updatedSettings,
                    "id_user": userId
                },
                {
                    where: { id_user: userId }
                },
                { transaction: t }
            ).then(function(isInsert) {
                // NOTE: upsert returns true if it was insert, otherwise returns false

                if (isInsert) {
                    logger.info("setting record for user %s inserted", userId);
                }
                else {
                    logger.info("setting record for user %s updated", userId);
                }
                return true;

            }).catch(function(error) {
                if (!error.nonce) {
                    if (error.name === "SequelizeForeignKeyConstraintError") {
                        message = "userId doesn't exist. Check the input";
                        logger.info("error when updating user settings: ", message);
                        error = helper.makeError("TRANSACTION_ERROR", message);
                    }
                }

                return promise.reject(error);
            })
        })
    }

    return doTransaction();
}

function updateUserSettings(req, res) {
    var params = req.swagger.params;
    var userId = params.userId.value;
    var settings = params.settings.value.settings;

    // current only format of setting is checked
    // need to check if each key value pair is valid
    var doValidation = function() {
        var message = "";
        var result = true;
        if (!(typeof(userId) === "number" && userId >= 0)) {
            message = "userId must be a non-negative number";
            result = false;
        }
        if (!(isJSON(settings, true) && Object.keys(settings).length > 0)) {
            // getting size of json:
            // http://stackoverflow.com/questions/13782698/get-total-number-of-items-on-json-object
            message = "settings must be a non-empty json object";
            result = false;
        }

        return {
            "result": result,
            "message": message
        }
    }

    var validationResult = doValidation();

    if (!validationResult.result) {
        throw(helper.makeError("INVALID_INPUT", validationResult.message));
    }
    else {
        updateUserSettingsMain(userId, settings).then(function(result) {
            if (result) {
                // settings updated
                res.json(settings);
            }
            else {
                return promise.reject(helper.makeError("TRANSACTION_ERROR", "no settings updated"));
            }
        }).catch(function(error) {
            if(!error.nonce) {
                logger.warn("error in updateUserSettings: unexpected error - %s, %s", error.name, error.message);
                logger.warn(error.stack);
                error = helper.makeError("TRANSACTION_ERROR", "internal service error");
            }

            helper.sendErrorResponse(res, error);
        })
    }
}

function getUserByIdMain(userId) {
    logger.debug("getting user info for #%s", userId);
    return promise.try(function() {
        var basicInfo = models.user.findOne({
            attributes: [
                ["id", "id"],
                ["username", "username"],
                ["first_name", "firstName"],
                ["last_name", "lastName"],
                ["email", "email"],
                ["phone_number", "phone"],
                ["activated", "activated"],
                ["role", "role"],
                ["migration_state", "migrationState"]
            ],
            where: {
                id: userId
            }
        }).then(function(result) {
            if (!result)
                result = {};
            else {
                result = result.dataValues;
            }
            return result;
        });

        var settings = models.settings.findOne({
            attributes: [
                ["settings", "settings"]
            ],
            where: {
                id_user: userId
            }
        }).then(function(result) {
            if (!result)
                result = {};
            else {
                result = result.dataValues.settings;
            }
            return result;
        });

        return [basicInfo, settings];
    }).spread(function(basicInfo, settings) {
        // reformat migration info
        if (Object.keys(basicInfo).length > 0) {
            // getting size of json:
            // http://stackoverflow.com/questions/13782698/get-total-number-of-items-on-json-object
            basicInfo.settings = settings;
            basicInfo.migration = {
                isMigrationDone: (!Boolean(basicInfo.migrationState) || basicInfo.migrationState === "done"),
                migrationState: basicInfo.migrationState
            }
            delete basicInfo.migrationState;
        }

        return basicInfo;
    })
}

function getUserById(req, res) {
    var params = req.swagger.params;
    var user = params.userId.value;
    var err = new Error();

    // input validation
    var doValidation = function() {
        if (!(typeof(user) === "number" && user >= 0)) {
            throw(helper.makeError("INVALID_INPUT", "userId must be a non-negative number"));
            return false;
        }
        return true;
    }

    if (doValidation()) {
        getUserByIdMain(user).then(function (result) {
            // remove username from result
            result.username = undefined;
            res.json(result);

        }).catch(function (error) {
            if (!error.nonce) {
                logger.warn("unexpected error: %s - %s", error.name, error.message);
                logger.warn(error.stack);
                error = helper.makeError("TRANSACTION_ERROR", "internal service error");
            }
            helper.sendErrorResponse(res, error);
        })
    }
}

function createUser(req, res) {
    var params = req.swagger.params;
    var user = params.user.value;
    var email = user.email;
    var installationId = user.installationId;
    var userId = undefined; // global variable for push notification

    var checkLegacyUser = (config.checkLegacyUser &&
        (
            (config.globalConfig.environment !== "test") ||
            (config.checkLegacyUserInTestEnv)
        )
    )

    return createUserWithUserInfo(user, false, checkLegacyUser).then(function(result) {
        userId = result.id;

        // send email and push notification
        var sendEmail = (config.sendEmailAfterCreatingUser) &&
        (
            (config.globalConfig.environment !== "test") ||
            (config.globalConfig.environment === "test" && config.sendEmailAfterCreatingUserInTestingEnv)
        );

        if (sendEmail) {
            logger.verbose("sending welcome email to user %s", userId);

            var options = {
              url:  'http://www.api.sendgrid.com/v3/templates/51576748-6cc8-4f85-b12f-aeff3dca37d4',
              headers: {
                  'Authorization': 'Bearer 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',
                  'Content-Type': 'application/json'
                }
            };

            function sendSignupEmail (error, response, body) {
                if (!error && response.statusCode == 200) {
                   var sendgridEmail = new sendgrid.Email();
                   sendgridEmail.addTo(email);
                   sendgridEmail.subject = "Welcome to Pitstop!";
                   sendgridEmail.from = 'Pitstop@getpitstop.io';
                   sendgridEmail.text = ' ';
                   sendgridEmail.html = JSON.parse(body).versions[0].html_content;
                   var sendEmail = promise.promisify(sendgrid.send, { context: sendgrid });
                   sendEmail(sendgridEmail).then(function(emailResult) {
                       logger.debug("email sent, server response: ", emailResult);
                       result.signupEmail = "sent";
                   }, function(error) {
                       logger.info("email not sent, server response:");
                       logger.info(error);
                       result.signupEmail = "failed";
                   });
                 } else {
                    logger.info("email not sent, server response:");
                    logger.info(error);
                    result.signupEmail = "failed";
                 }
            }

            request(options, sendSignupEmail);

        } else {
            // debug
            logger.debug("not sending welcome email to user %s", userId);
            res.json(result);
        }

        if (installationId) {
           logger.verbose("sending welcome notification to user %s", userId);
           // push notification
           var options = {
              name: "welcome",
              data: {
                  "content": [ result.firstName ]
              },
              recipients: [installationId],
           }
           pushAdapter.sendNotification(options).catch(function(error) {
              logger.warn("unexpected error when sending welcome push message for user with installtion id %s", installationId);
              logger.warn(error.stack);
           });
        }
        else {
            logger.verbose("no installtion id found for user %s, skipping welcome push message", userId);
        }

        res.json(result);

    }).catch(function(error) {
        if (!error.nonce) {
            logger.warn("error in createUser:", "unexpected error");
            logger.warn(error.stack)
            error = helper.makeError("TRANSACTION_ERROR", "internal service error");
        }

        helper.sendErrorResponse(res, error);
    });
}

function updateUser(req,res) {
    // TODO: enforce that only email, firstname, lastname, phone can be updated

    var params = req.swagger.params;
    var user = params.user.value;
    var userId = user.userId;
    var activated = user.activated;
    var firstName = user.firstName;
    var lastName = user.lastName;
    var email = user.email;
    var phone = user.phone;
    var err = new Error();
    var message;

    function doTransaction() {
        return sequelize.transaction(function(t) {
            var value = {
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phone,
                    email: email,
                    activated: activated
                };

            for (var i in value) {
                if(value[i] === undefined)
                    delete value[i];
            }

            return models.user.update(
                value,
                {where: { id: user.userId }},
                {transaction: t}
            ).then(function(updatedUser) {
                return updatedUser;
            }, function(error) {
                if (error.name === "SequelizeUniqueConstraintError") {
                    var cause = u.find(error.errors, function(item) {
                        return item.type === "unique violation";
                    });

                    if (cause !== undefined) {
                        message = cause.path + " " + cause.value + " is already used";
                        logger.info("error when creating user: ", message);
                        err.nonce = true;
                        err.name = "TRANSACTION_ERROR";
                        err.message = message;
                        error = err;
                    }
                }
                return promise.reject(error);
            });
        }, function(error) {
            logger.warn("error when updating user:");
            logger.warn(error.stack);
            err.nonce = true;
            err.message = "internal db error";
            helper.sendErrorResponse(res, err);
        });
    }

     // VALIDATIONS
    var doValidation = function() {
        if (userId < 0) {
            err.nonce = true;
            err.name = "INVALID_INPUT";
            err.message = "userId must be a non-negative number";
            throw err;
            return false;
        }

        if (!(firstName || phone || email || activated !== undefined)) {
            err.nonce = true;
            err.name = "INVALID_INPUT";
            err.message = "Please enter one of firstName, phone, email, activated";
            throw err;
            return false;
        }
        return true;
    }
    if (doValidation()) {
        doTransaction().then(function (result) {
            // not using "===": result would either be "[ 0 ]" or "[ 1 ]" as in console.log,
            // type is "object" but there is no details about that is being returned
            // ref: https://github.com/sequelize/sequelize/pull/1293
            if (!result || result == 0) {
                message = "user is not updated: no records affected in db";
                logger.info(message);
                err.nonce = true;
                err.name = "INVALID_INPUT";
                err.message = message;
                return promise.reject(err);
            } else {
                result = {};
                result.userId = userId;
                result.firstName = firstName;
                result.lastName = lastName;
                result.phone = phone;
                result.email = email;
                result.activated = activated;
                return result;
            }
        }, function (error) {
            if (!error.nonce && error.errors && error.errors[0]) {
                message = error.errors[0].message;
                logger.info("error when updating user: ", error);
                err.nonce = true;
                err.message = message || "internal db error";
                error = err;
            }
            return promise.reject(error);
        }).then(function (result) {
            res.json(result);
        }, function (error) {
            helper.sendErrorResponse(res, error);
        });
    }
}

function createUserWithUserInfo(userInfo, isPasswordHashed, checkLegacyUser) {
    var firstName = userInfo.firstName;
    var lastName = userInfo.lastName;
    var email = userInfo.email;
    var username = userInfo.username;
    var password = userInfo.password;
    var phone = userInfo.phone;
    var isSocial = userInfo.isSocial;
    var installationId = userInfo.installationId || null;

    var message = "";

    isPasswordHashed = (typeof(isPasswordHashed) === "undefined")
                        ? isPasswordHashed = false
                        : isPasswordHashed;

    checkLegacyUser = (typeof(checkLegacyUser) === "undefined")
                        ? checkLegacyUser = false
                        : checkLegacyUser;

    function doTransaction() {
        return sequelize.transaction(function(t) {
            var payload = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                username: username,
                password: password,
                phone_number: phone,
                activated: false,
                role: "customer"
            };
            return models.user.create(payload, {transaction: t});
        });
    }

    function doCreate() {
        if (password) {
            if (isPasswordHashed) {
                return doTransaction();
            }
            else {
                return encrypt.hash(password).then(function(hashedPassword) {
                    password = hashedPassword;
                    return doTransaction();
                })
            }
        } else if (isSocial) {
            return doTransaction();
        } else {
            return promise.reject(helper.makeError("TRANSACTION_ERROR", "password must be a string"));
        }
    }
    function doValidaiton() {
        function basicValidation() {
            // validation
            logger.debug("basic validation for user %s", username);
            if (!(firstName && email && username)) {
                return promise.reject(helper.makeError("INVALID_INPUT", "firstName, email, username must be non-empty strings"));
            }
            if (!password && !isSocial) {
                return promise.reject(helper.makeError("INVALID_INPUT", "either password should be provided or user is from other auth provider"));
            }
            if (typeof(password) === "string" && (!password)) {
                return promise.reject(helper.makeError("INVALID_INPUT", "password must be non-empty string if provided"));
            }
            return promise.resolve(true);
        }
        function legacyUserValidation() {
            // checks whether username or email was used in Parse
            if (checkLegacyUser) {
                logger.debug("checking whether username or email was used in Parse for user %s", username);
                return ParseModels.user.find().or(
                    [
                        { "username": username },
                        { "email": email }
                    ]
                ).then(function(result) {
                    if (result.length > 0) {
                        return promise.reject(helper.makeError("INVALID_INPUT", "username or email was already used"));
                    }
                    else {
                        return promise.resolve(true);
                    }
                })
            }
            else {
                return promise.resolve(true); // dont check
            }
        }

        return promise.all([ basicValidation(), legacyUserValidation() ]);
    }

    // TODO: validate password before creating user
    return doValidaiton().then(function () {
        return doCreate();
    }).catch(function(error) {
        logger.verbose("validation failed for user %s: %s", username, error.message);
        return promise.reject(error);
    }).then(function (result) {
        return getUserByIdMain(result.dataValues.id).then(function(result) {
            delete result.username; // remove username from result
            return result;
        });
    }).catch(function(error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            var cause = u.find(error.errors, function (item) {
                return item.type === "unique violation";
            });

            if (cause !== undefined) {
                message = cause.path + " " + cause.value + " is already used";
                logger.info("error when creating user:", message);
                error = helper.makeError("TRANSACTION_ERROR", message);
            }
        }

        if (!error.nonce) {
            logger.warn("error when creating user:", "unexpected error");
            logger.warn(error.stack);
            error = helper.makeError("TRANSACTION_ERROR", "internal service error");
        }

        return promise.reject(error);
    });
}
