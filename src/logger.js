/**
 * @file logger.js
 * @author schoeu
 * */

var winston = require('winston');
var moment = require('moment');
var DailyRotateFile=require('winston-daily-rotate-file');

// 时间格式化方法
var dateFormat=function() {
    return moment().format('YYYY-MM-DD HH:mm:ss:SSS');
};

/**
 * 日志方法定义
 * @param {Array} accesslog 访问日志路径
 * @param {Array} errorlog 错误日志路径
 * @return {Object}
 * */
module.exports = function (accesslog, errorlog) {
    var accessLoggerTransport = new DailyRotateFile({
        name: 'access',
        filename: accesslog,
        timestamp:dateFormat,
        level: 'info',
        colorize:true,
        maxsize:1024*1024*10,
        datePattern:'.yyyy-MM-dd'
    });
    var errorTransport=new (winston.transports.File)({
        name: 'error',
        filename: errorlog,
        timestamp:dateFormat,
        level: 'error',
        colorize:true
    });
    var logger=new winston.Logger({
        transports: [
            accessLoggerTransport,
            errorTransport
        ]
    });
};