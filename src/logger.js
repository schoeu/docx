/**
 * @file logger.js
 * @description 日志模块
 * @author schoeu
 * */

var fs = require('fs-extra');
var path = require('path');
var winston = require('winston');
var moment = require('moment');
var DailyRotateFile = require('winston-daily-rotate-file');

var config = require('./config');

var MAX_SIZE = 1024 * 1024 * 5;
var ACCESS_LOG_NAME = 'access.log';
var ERROR_LOG_NAME = 'error.log';

// 时间格式化方法
var dateFormat = function () {
    return moment().format('YYYY-MM-DD HH:mm:ss:SSS');
};

var loggerPath = config.get('logPath');
// 日志文件设置,如果是绝对路径,则使用绝对路径, 如果是相对路径,则计算出最终路径
if (!path.isAbsolute(loggerPath)) {
    loggerPath = path.join(process.cwd(), loggerPath);
}

// 没有该目录则创建
fs.mkdirsSync(loggerPath);

var accesslog = path.join(loggerPath, ACCESS_LOG_NAME);
var errorlog = path.join(loggerPath, ERROR_LOG_NAME);

var accessLoggerTransport = new DailyRotateFile({
    name: 'access',
    filename: accesslog,
    timestamp: dateFormat,
    level: config.get('logLevel'),
    colorize: true,
    maxsize: MAX_SIZE,
    datePattern: '.yyyy-MM-dd'
});
var errorTransport = new DailyRotateFile({
    name: 'error',
    filename: errorlog,
    timestamp: dateFormat,
    level: 'error',
    colorize: true,
    maxsize: MAX_SIZE,
    datePattern: '.yyyy-MM-dd'
});

/**
 * 日志方法定义
 * @param {string} loggerPath 日志路径
 * @return {Object}
 * */
module.exports = new winston.Logger({
    transports: [
        accessLoggerTransport,
        errorTransport
    ]
});
