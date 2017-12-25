/**
 * @file index.js
 * @description 文档入口文件
 * @author schoeu
 * */

// 获取配置信息
var config = require('./src/config');

config.init(process.argv[2]);
var docx = require('./src/index');
docx.use(function (req, res, next) {
    next();
});

docx.use('trees', function (data) {
    return data;
});