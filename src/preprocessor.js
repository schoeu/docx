/**
 * @file preprocessor.js
 * @author schoeu
 * 文件预处理
 * */

var path = require('path');
var child_process = require('child_process');
var pinyin = {};
var glob = require('glob');
var utils = require('./utils.js');
var logger = require('./logger.js');
var config = require('./config');
var tempCache = [];
var usePinyin = config.get('usePinyin');
if (usePinyin) {
    pinyin = require('pinyin');
}

module.exports = function () {

    // 定制脚本路径
    var preScript = config.get('preprocessScript');

    // 如果有定制脚本则先执行定制脚本
    if (preScript) {
        try {
            var presInfo = child_process.execFileSync(preScript);
            logger.info({'preprocessInfo: ': presInfo.toString()});
        }
        catch(e){
            logger.error({'preprocess script error: ': e});
        }
    }

    var docPath = config.get('docPath');
    var mdFiles = glob.sync(path.join(docPath, '**/*.md')) || [];
    var htmlFiles = glob.sync(path.join(docPath, '**/*.html')) || [];
    var files = mdFiles.concat(htmlFiles);

    // 清空索引
    tempCache = [];

    files.forEach(function (it) {
        var pos = [];
        var len = 0;
        var initials = '';
        var spell = '';

        it = decodeURIComponent(it);

        var title = utils.getMdTitle(it);

        if (usePinyin) {
            initials = pinyin(title, {
                style: pinyin.STYLE_FIRST_LETTER
            }).join('');

            spell = pinyin(title, {
                style: pinyin.STYLE_NORMAL
            }).map(function (s) {
                s = s.toString();
                pos.push(len);
                len += s.length;
                return s;
            }).join('');
        }

        tempCache.push({
            title: title,
            pos: pos,
            path: it.replace(docPath, ''),
            spell: spell,
            initials: initials
        });
    });

    return tempCache;
};
