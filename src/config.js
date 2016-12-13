/**
 * @file index.js
 * @description 文档平台主文件
 * @author schoeu
 * */

var path = require('path');
var fs = require('fs-extra');

module.exports = {
    init: function (conf) {
        var me = this;
        var confFile = './docx-conf.json';

        conf = conf ? conf : confFile;

        // 默认配置,减少配置文件条目数,增加易用性与容错
        var defaultOptions = {
            logPath: './log',
            dirsConfName: 'map.json',
            port: '8910',
            logLevel: 'info',
            index: '/readme.md',
            theme: 'default',
            preprocessScript: '',
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

        if (!path.isAbsolute(conf)) {
            conf = path.join(process.cwd(), conf);
        }

        // 读取配置内容
        if (path.extname(conf).trim === "") {
            conf = path.join(conf, defaultOptions.dirsConfName);
        }
        var confJson = fs.readJsonSync(conf);

        var docPath = confJson.path;
        if (!path.isAbsolute(docPath)) {
            docPath = path.join(process.cwd(), docPath);
        }

        // 合并配置
        var reConf =  Object.assign({}, defaultOptions, confJson);
        me.conf = reConf;
    },
    set: function (key, value) {
        if (this.conf && key) {
            this.conf[key] = value;
            return true;
        }
        return false;
    },
    get: function (key) {
        if (this.conf && key) {
            var confItem = this.conf[key];
            if (confItem) {
                return confItem;
            }
        }
        return '';
    },
    refresh: function () {
        this.init();
    }
};