/**
 * @file index.js
 * @description 文档平台主文件
 * @author schoeu
 * */

var path = require('path');
var fs = require('fs-extra');

var confFile = '../docx-conf.json';
var conf = getConf();


// 获取配置
function getConf() {
    // 读取配置内容
    var confJson = fs.readJsonSync(path.join(__dirname, confFile));

    var docPath = confJson.path;
    if (!path.isAbsolute(docPath)) {
        docPath = path.join(process.cwd(), docPath);
    }

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
        docPath: docPath
    };

    // 合并配置
    return Object.assign({}, defaultOptions, confJson);

}

module.exports = {
    conf: conf,
    set: function (key, value) {
        if (conf && key) {
            conf[key] = value;
            return true;
        }
        return false;
    },
    get: function (key) {
        if (conf && key) {
            var confItem = conf[key];
            if (confItem) {
                return confItem;
            }
        }
        return '';
    },
    refresh: function () {
        getConf();
        this.conf = conf;
    }
};