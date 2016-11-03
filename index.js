/**
 * @file index.js
 * @description 文档入口文件
 * @author schoeu
 * */

var Docx = require('./src/index');
var config = require('./src/config');
new Docx(process.argv[2]);

//