/**
 * @file preprocessor.js
 * @author schoeu
 * 文件预处理
 * */

var fs = require('fs');
var path = require('path');
var pinyin = require('pinyin');
var glob = require('glob');
var utils = require('./utils.js');
var CONF = require('../docx-conf.json');
var tempCache = [];
/**
 * 文件初始化处理
 * **/
function init() {
    var mdFiles = glob.sync(path.join(CONF.path, '**/*.md')) || [];
    var htmlFiles = glob.sync(path.join(CONF.path, '**/*.html')) || [];
    var files = mdFiles.concat(htmlFiles);

    files.forEach(function (it) {
        it = decodeURIComponent(it);

        var title = utils.getMdTitle(it);

        var initials = pinyin(title,{
            /*heteronym:true,
            segment:true,*/
            style:pinyin.STYLE_FIRST_LETTER
        }).join('');

        var pos = [];
        var len = 0;
        var spell = pinyin(title,{
            /*heteronym:true,
            segment:true,*/
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
            path: it.replace(CONF.path, ''),
            spell: spell,
            initials: initials
        });
    });

    var cacheDir = path.join(__dirname, '..', CONF.cacheDir);
    fs.writeFileSync(cacheDir, JSON.stringify(tempCache));
}


module.exports = {
    init: init
};