/**
 * @file api.js
 * @description 接口测试文件
 * @author schoeu
 * */

var expect = require('chai').expect;
var config = require('../src/config');
var confPath = './test/map.test.json';
config.init(confPath);
var Docx = require('../src/index');

describe('api test.', function () {
    it('open web service.', function () {
        new Docx();
    });
});
