/**
 * @file preprocessor.js
 * @author schoeu
 * 文件预处理
 * */

var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var pinyin = require('pinyin');
var glob = require('glob');
var utils = require('./utils.js');
var tempCache = [];
/**
 * 文件初始化处理
 * **/
function init(conf, logger) {
    // 定制脚本路径
    var preScript = conf.preprocessScript || '';

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

    var mdFiles = glob.sync(path.join(conf.path, '**/*.md')) || [];
    var htmlFiles = glob.sync(path.join(conf.path, '**/*.html')) || [];
    var files = mdFiles.concat(htmlFiles);

    files.forEach(function (it) {
        it = decodeURIComponent(it);

        var title = utils.getMdTitle(it);

        var initials = pinyin(title,{
            style:pinyin.STYLE_FIRST_LETTER
        }).join('');

        var pos = [];
        var len = 0;
        var spell = pinyin(title,{
            style:pinyin.STYLE_NORMAL
        }).map(function (s) {
            s = s.toString();
            pos.push(len);
            len += s.length;
            return s;
        }).join('');

        tempCache.push({
            title: title,
            //content: fileContent,
            pos: pos,
            path: it.replace(conf.path, ''),
            spell: spell,
            initials: initials
        });
    });

    var cacheDir = path.join(__dirname, '..', conf.cacheDir);
    fs.writeFileSync(cacheDir, JSON.stringify(tempCache));
}

module.exports = {
    init: init
};