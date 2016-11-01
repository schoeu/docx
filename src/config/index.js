var path = require('path');
var fs = require('fs-extra');

var confFile = './docx-conf.json';
var confPath = path.join('../..', confFile);

// 读取配置内容
var consJson = fs.readJsonSync(confPath);

// 默认配置,减少配置文件条目数,增加易用性与容错
var defaultOptions = {
    logPath: './log',
    dirsConfName: 'map.json',
    port: '8910',
    logLevel: 'info',
    index: '/readme.md',
    theme: 'default',
    preprocessScript: '',
    cacheDir: './cache.json',
    searchConf: {
        matchDeep: 2,
        matchWidth: 120
    },
    extUrls: {},
    waringFlag: false,
    debug: true,
    usePinyin: true,
    ignoreDir: [],
    docPath: consJson.path
};

// 合并配置
var conf = Object.assign({}, defaultOptions, consJson);

module.exports = {
    conf: conf,
    set: function (key, value) {
        if (consJson && key) {
            consJson[key] = value;
            return true;
        }
        return false;
    },
    get: function (key) {
        if (consJson && key) {
            var confItem = consJson[key];
            if (confItem) {
                return confItem;
            }
        }
        return '';
    }
};