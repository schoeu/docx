/**
 * @file search.js
 * @author schoeu
 * 文件搜索模块
 * */

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var CONF = require('../docx-conf.json');
var searchConf = CONF.searchConf || {};

function searchContent(key, content) {
    var matchIdx = 0;
    var matchContent = [];
    var lastestIdx = 0;
    var reg = new RegExp(key,'ig');
    var keyLength = key.length;

    while(reg.exec(content)) {
        var lastIndex = reg.lastIndex;
    // for(;(lastIndex = content.indexOf(key, lastIndex + keyLength)) > 0;) {
        if ((matchIdx < searchConf.matchDeep) && (lastIndex - lastestIdx > searchConf.matchWidth)) {

            // 匹配结果位置在配置范围内的则忽略,以防多次截取相同范围内容
            var matched = content.substring(lastIndex - searchConf.matchWidth, lastIndex + searchConf.matchWidth + keyLength);

            // 飘红内容关键字
            var rpStr = matched.replace(/\s/img, '').replace(/[<>]/g,'').replace(reg, function (m) {
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

function search(type, key) {
    key = key || '';
    key = key.replace(/\s+/img, '.*').replace(/^(\.\*)*|(\.\*)*$/img, '');
    var keyLength = key.length;
    var files = glob.sync(path.join(CONF.path, '**/*.md')) || [];
    var titleReg = /^\s*\#+\s?(.+)/;
    var reg = new RegExp(key,'img');
    var searchRs = [];
    // 如果有关键词,则开始搜索
    if (keyLength) {
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
                var contentMt = searchContent(key, content);
                // 飘红title关键字
                contentMt = contentMt.replace(reg, function (m) {
                    return '<span class="hljs-string">' + m + '</span>';
                });

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