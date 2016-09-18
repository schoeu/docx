/**
 * @file search.js
 * @author schoeu
 * 文件搜索模块
 * */

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var Segment = require('segment');
var pinyinlite = require('pinyinlite');
var utils = require('./utils.js');
var CONF = require('../docx-conf.json');
var searchConf = CONF.searchConf || {};

var mdFiles = glob.sync(path.join(CONF.path, '**/*.md')) || [];
var htmlFiles = glob.sync(path.join(CONF.path, '**/*.html')) || [];
var files = mdFiles.concat(htmlFiles);
var titleCache = {
    titles:[],
    titlesSpell:[]
};
files.forEach(function (it) {
    var title = utils.getMdTitle(it);
    titleCache.titles.push(title);
    titleCache.titlesSpell.push(pinyinlite(title).join(' '));
});


// 创建实例
var segment = new Segment();
// 使用默认的识别模块及字典
segment.useDefault();

/**
 * 内容搜索
 * @param {String} key 处理过的关键词正则
 * @param {String} content 文档内容
 * @return {String} 匹配到的文档字符串
 * */
function searchContent(key, content) {
    var matchIdx = 0;
    var matchContent = [];
    var lastestIdx = 0;
    var reg = new RegExp(key,'ig');
    var keyLength = key.length;

    while(reg.exec(content)) {
        var lastIndex = reg.lastIndex;
        if ((matchIdx < searchConf.matchDeep) && (lastIndex - lastestIdx > searchConf.matchWidth)) {
            // 匹配结果位置在配置范围内的则忽略,以防多次截取相同范围内容
            var matched = content.substring(lastIndex - searchConf.matchWidth, lastIndex + searchConf.matchWidth + keyLength);

            matched = matched.replace(/\s/img, '')
                .replace(/<img.*?>/,'')
                .replace(/<h(\d)>.*?<\/h\1>/g,'');

            // 飘红内容关键字
            var rpStr = matched.replace(reg, function (m) {
                return '<span class="hljs-string">' + m + '</span>';
            });

            if (!rpStr) {
                continue;
            }
            // 保存匹配结果
            matchContent.push(rpStr);
            matchIdx ++;
            lastestIdx = lastIndex;
        }
    }

    return matchContent.join('...');
}

/**
 * 搜索主方法
 * @param {String} type 搜索类型
 * @param {String} key 关键字
 * @return {Array} 匹配到的文档字符串数组
 * */

function search(type, key) {
    key = key || '';
    var keyLength = key.trim().length;
    // 如果有关键词,则开始搜索
    if (keyLength) {
        var keys = segment.doSegment(key, {
            simple: true
        });

        var cutkeys = keys.join(' ').replace(/\s+/img, '|').replace(/^(\|)*|(\|)*$/img, '');
        var titleReg = /^\s*\#+\s?(.+)/;
        var reg = new RegExp(cutkeys,'img');
        var searchRs = [];
        files.forEach(function (it) {
            if (it) {
                it = decodeURIComponent(it);
            }
            // markdown内容
            var content = fs.readFileSync(it).toString();

            // 标题内容
            var titleArr =  titleReg.exec(content) || [];
            var titleStr = titleArr[1] || '';

            // 飘红title关键字
            titleStr = titleStr.replace(reg, function (m) {
                return '<span class="hljs-string">' + m + '</span>';
            });

            if (type === 'title') {
                if (reg.exec(titleStr)) {
                    var searchData = {
                        path: it.replace(CONF.path, ''),
                        title: titleStr
                    };
                    searchRs.push(searchData);
                }
            }
            else {
                var contentMt = searchContent(cutkeys, content);

                var searchCData = {
                    path: it.replace(CONF.path, ''),
                    title: titleStr,
                    content: contentMt
                };

                // 如果只有标题匹配,内容无字段匹配
                if (reg.exec(titleStr)) {
                    if (!contentMt) {
                        searchCData.content = content.substring(0, searchConf.matchWidth) + '...';
                    }
                    searchRs.unshift(searchCData);
                }
                // 内容匹配
                else {
                    if (contentMt) {
                        searchRs.push(searchCData);
                    }
                }
            }
        });
    }
    return searchRs;
}

module.exports = search;