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
    it('get function', function () {
        expect(config.get('headText')).to.be.equal('header');
    });
    it('set function', function () {
        config.set('theme', 'newsytle');
        expect(config.get('theme')).to.be.equal('newsytle');
    });
    it('refresh function', function () {
        config.set('port', '8911');
        config.refresh();
        expect(config.get('port')).to.be.equal('8910');
    });
});
