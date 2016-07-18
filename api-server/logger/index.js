"use strict";

var winston = require("winston");
var fs = require("fs");
var moment = require("moment-timezone");

var config = {
    logDir: "log",
    level: "debug"
}
var env = process.env.ENVIRONMENT || 'dev'

var logDir = config.logDir
var level = config.level

var logger = null;

var formatter = function(options) {
    var result = winston.config.colorize(
        options.level, "[" + options.timestamp() + "] ") +
        winston.config.colorize(options.level, options.level.toUpperCase()) + ": " +
        (undefined !== options.message ? options.message : '') +
        (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );

    return result;
}

if (!fs.existsSync(config.logDir)) {
    fs.mkdirSync(config.logDir);
}

winston.setLevels(winston.config.npm.levels);
winston.addColors(winston.config.npm.colors);

logger = new(winston.Logger)({
    transports: [
        new winston.transports.Console({
            level: level || "warn",
            colorize: true,
            timestamp: function() {
                return moment().format("ddd YYYY-MM-DD HH:mm:ss Z");
            },
            handleExceptions: true,
            json: false,
            formatter: formatter

        }),
        // new winston.transports.File({
        //     level: env === 'development' ? 'debug' : 'info',
        //     filename: logDir + '/logs.log',
        //     maxsize: 1024 * 1024 * 10 // 10MB
        // })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: 'log/exceptions.log'
        })
    ],
    exitOnError: false
});

module.exports = logger;
