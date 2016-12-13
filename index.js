/**
 * @file index.js
 * @description 文档入口文件
 * @author schoeu
 * */

// 配置现行
var config = require('./src/config');

config.init(process.argv[2]);
var Docx = require('./src/index');
new Docx();
