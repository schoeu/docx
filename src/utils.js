/**
 * @file utils.js
 * @author schoeu
 * */

var fs = require('fs');
var path = require('path');

module.exports = {
    /**
     * 获取markdown文件大标题
     *
     * @param {String} markdown文件的路径
     * @return {String} markdown文件大标题
     * */
    getMdTitle: function(dir) {
        if (!dir) {
            return '';
        }
        var titleArr = [];
        var ext = path.extname(dir);
        dir = decodeURIComponent(dir);
        var content = fs.readFileSync(dir).toString();

        if (ext === '.md') {
            titleArr =  /^\s*\#+\s?(.+)/.exec(content);
            return titleArr[1] || '';
        }
        else if (ext === '.html' || ext === '.htm'){
            titleArr = /<title>(.+?)<\/title>/.exec(content);
            return titleArr[1] || '';
        }
        else {
            return '';
        }

    }
};