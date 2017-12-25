/**
 * @file index.js
 * @description 文档入口文件
 * @author schoeu
 * */

// 获取配置信息
var config = require('./src/config');

config.init(process.argv[2]);
var Docx = require('./src/index');
var ins = new Docx();
ins.use(function (req, res) {
    console.log(req);
});

ins.use('trees', function (data) {
    console.log(data);
});