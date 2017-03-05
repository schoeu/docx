/**
 * @file search.js
 * @author schoeu
 * @description 文件搜索模块
 * */

var fs = require('fs-extra');
var path = require('path');
var glob = require('glob');
var _ = require('lodash');
var config = require('./config');
var cache;

// 创建实例
var segment;

var usePinyin = config.get('usePinyin');
var searchConf = config.get('searchConf') || {};

if (usePinyin) {
    var Segment = require('segment');
    // 创建实例
    segment = new Segment();
    // 使用默认的识别模块及字典
    segment.useDefault();
}


/**
 * 内容搜索
 *
 * @param {string} key 处理过的关键词正则
 * @param {string} content 文档内容
 * @return {string} 匹配到的文档字符串
 * */
function searchContent(key, content) {
    var matchIdx = 0;
    var matchContent = [];
    var lastestIdx = 0;
    var reg = new RegExp(key, 'ig');
    var keyLength = key.length;

    while (reg.exec(content)) {
        var lastIndex = reg.lastIndex;
        if ((matchIdx < searchConf.matchDeep) && (lastIndex - lastestIdx > searchConf.matchWidth)) {
            // 匹配结果位置在配置范围内的则忽略,以防多次截取相同范围内容
            var matched = content.substring(lastIndex - searchConf.matchWidth,
                lastIndex + searchConf.matchWidth + keyLength);

            matched = matched.replace(/\s/img, '')
                .replace(/<img.*?>/, '')
                .replace(/<h(\d)>.*?<\/h\1>/g, '')
                .replace(/strong/img, '');

            // 飘红内容关键字
            var rpStr = matched.replace(reg, function (m) {
                return '<span class="hljs-string">' + m + '</span>';
            });

            if (!rpStr) {
                continue;
            }
            // 保存匹配结果
            matchContent.push(rpStr);
            matchIdx = matchIdx + 1;
            lastestIdx = lastIndex;
        }
    }

    return matchContent.join('...');
}

/**
 * 搜索主方法
 * @param {string} type 搜索类型
 * @param {string} key 关键字
 * @return {Array} 匹配到的文档字符串数组
 * */

function search(type, key) {
    key = key || '';
    key = key.replace(/\./g, '\\.');

    var titleSe = [];
    // 如果有关键词,则开始搜索
    if (!key.trim().length) {
        return [];
    }
    if (type === 'title') {
        // 启用拼音搜索
        if (usePinyin) {
            var titleKeys = segment.doSegment(key, {
                simple: true
            });
            cache.forEach(function (it) {
                var em = [key].concat(titleKeys);
                var isGet = false;
                var pos = it.pos || [];
                var title = it.title || '';
                var initials = it.initials || '';

                // spell检索
                var sIdx = it.spell.indexOf(key);
                if (sIdx > -1) {
                    var pIdx = pos.indexOf(sIdx);
                    if (pIdx > -1) {
                        var wordCount = 0;
                        for (var i = pIdx; i < pos.length; i++) {
                            if ((sIdx + key.length) <= pos[i]) {
                                break;
                            }
                            wordCount = wordCount + 1;
                        }
                        var sele = title.substr(pIdx, wordCount);
                        em.push(sele);
                        isGet = true;
                    }
                }

                // initials检索
                var iIdex = initials.indexOf(key);
                if (iIdex > -1) {
                    var iele = title.substr(iIdex, key.length);
                    em.push(iele);
                    isGet = true;
                }

                // 去重
                em = _.uniq(em);
                var emkeys = em.join(' ').replace(/\s+/img, '|').replace(/^(\|)*|(\|)*$/img, '');
                var emReg = new RegExp(emkeys, 'img');

                if (isGet || emReg.exec(title)) {

                    // 飘红title关键字
                    title = title.replace(emReg, function (m) {
                        return '<span class="hljs-string">' + m + '</span>';
                    });

                    titleSe.push({
                        path: it.path,
                        title: title
                    });
                }
            });
        }
        // 字母搜索,适合无中文环境
        else {
            var forReg = new RegExp(key, 'ig');
            var forIsMatched = false;
            cache.forEach(function (it) {
                var title = it.title || '';
                forIsMatched = false;
                // 飘红内容关键字
                var forTitle = title.replace(forReg, function (m) {
                    forIsMatched = true;
                    return '<span class="hljs-string">' + m + '</span>';
                });
                if (forIsMatched) {
                    // 保存匹配结果
                    titleSe.push({
                        path: it.path,
                        title: forTitle
                    });
                }
            });
        }

        return titleSe;
    }
    var docPath = config.get('path');
    var mdFiles = glob.sync(path.join(docPath, '**/*.md')) || [];
    var htmlFiles = glob.sync(path.join(docPath, '**/*.html')) || [];
    var files = mdFiles.concat(htmlFiles);
    var cutkeys = key;
    if (usePinyin) {
        var titleKeysL = segment.doSegment(key, {
            simple: true
        });
        cutkeys = titleKeysL.join(' ').replace(/\s+/img, '|').replace(/^(\|)*|(\|)*$/img, '');
    }
    var titleReg = /^\s*\#+\s?(.+)/;
    var reg = new RegExp(cutkeys, 'img');
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

        var contentMt = searchContent(cutkeys, content);

        var searchCData = {
            path: it.replace(docPath, ''),
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
    });
    return searchRs;
}

/**
 * 搜索
 * @return {Function} 更新搜索缓存方法
 * @return {Function} 搜索方法
 * */
module.exports = {
    readCache: function (data) {
        cache = data || {};
    },
    search: search
};
