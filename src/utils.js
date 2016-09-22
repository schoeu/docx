/**
 * @file utils.js
 * @author schoeu
 * */

var fs = require('fs');
var path = require('path');
var highlight = require('highlight.js');
var marked = require('marked');

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
            titleArr =  /^\s*\#+\s?(.+)/.exec(content) || [];
            return titleArr[1] || '';
        }
        else if (ext === '.html' || ext === '.htm'){
            titleArr = /<title>(.+?)<\/title>/.exec(content) || [];
            return titleArr[1] || '';
        }
        else {
            return '';
        }

    },

    /**
     * markdown文件转html处理
     *
     * @param {String} content markdown字符串
     * @return {String} html字符串
     * */
    getMarked: function (content) {
        var renderer = new marked.Renderer();

        // markdown中渲染代码处理
        renderer.code = function (data, lang) {
            data = highlight.highlightAuto(data).value;
            if (lang) {
                // 超过3行有提示
                if (data.split(/\n/).length >= 3) {
                    var html = '<pre><code class="hljs lang-'+ lang +'"><span class="hljs-lang-tips">' + lang + '</span>';
                    return html + data + '</code></pre>';
                }
                return '<pre><code class="hljs lang-${lang}">' + data + '</code></pre>';
            }
            return '<pre><code class="hljs">' + data + '</code></pre>';
        };

        return marked(content, {renderer});
    }
};