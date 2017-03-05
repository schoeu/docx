/**
 * @file conf.js
 * @description 配置测试文件
 * @author schoeu
 * */

var expect = require('chai').expect;
var config = require('../src/config');
var confPath = './test/map.test.json';
config.init(confPath);

describe('config test', function () {
    it('get config file.', function () {
        expect(config.get('port')).to.be.equal('8910');
    });
});
