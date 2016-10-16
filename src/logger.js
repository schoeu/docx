/**
 * @file logger.js
 * @author schoeu
 * */

var fs = require('fs-extra');
var path = require('path');
var winston = require('winston');
var moment = require('moment');
var DailyRotateFile=require('winston-daily-rotate-file');

var MAX_SIZE = 1024 * 1024 * 5;
var ACCESS_LOG_NAME = 'access.log';
var ERROR_LOG_NAME = 'error.log';

// 时间格式化方法
var dateFormat=function() {
    return moment().format('YYYY-MM-DD HH:mm:ss:SSS');
};

/**
 * 日志方法定义
 * @param {String} loggerPath 日志路径
 * @return {Object}
 * */
module.exports = function (loggerPath) {
    // 没有该目录则创建
    fs.mkdirsSync(loggerPath);

    var accesslog = path.join(loggerPath, ACCESS_LOG_NAME);
    var errorlog = path.join(loggerPath, ERROR_LOG_NAME);

    var accessLoggerTransport = new DailyRotateFile({
        name: 'access',
        filename: accesslog,
        timestamp:dateFormat,
        level: 'info',
        colorize:true,
        maxsize:MAX_SIZE,
        datePattern:'.yyyy-MM-dd'
    });
    var errorTransport = new DailyRotateFile({
        name: 'error',
        filename: errorlog,
        timestamp:dateFormat,
        level: 'error',
        colorize:true,
        maxsize:MAX_SIZE,
        datePattern:'.yyyy-MM-dd'
    });
    return new winston.Logger({
        transports: [
            accessLoggerTransport,
            errorTransport
        ]
    });
};