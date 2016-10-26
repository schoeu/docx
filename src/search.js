/**
 * @file search.js
 * @author schoeu
 * 文件搜索模块
 * */

var fs = require('fs-extra');
var path = require('path');
var glob = require('glob');
var _ = require('lodash');
var Segment = require('segment');
var cache;
var CONF;
var searchConf = {};

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
                .replace(/<h(\d)>.*?<\/h\1>/g,'')
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

    var keys = segment.doSegment(key, {
        simple: true
    });

    // 如果有关键词,则开始搜索
    if (!key.trim().length) {
        return [];
    }
    if (type === 'title') {
        var titleSe = [];
        cache.forEach(function (it) {
            var em = [key].concat(keys);
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
                    for (var i=pIdx; i<pos.length; i++) {
                        if ((sIdx + key.length) <= pos[i]) {
                            break;
                        }
                        wordCount ++;
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
            var emReg = new RegExp(emkeys,'img');

            if (isGet || emReg.exec(title)) {

                // 飘红title关键字
                var title = title.replace(emReg, function (m) {
                    return '<span class="hljs-string">' + m + '</span>';
                });

                titleSe.push({
                    path: it.path,
                    title: title
                });
            }
        });

        return titleSe;
    }
    else {
        var mdFiles = glob.sync(path.join(CONF.docPath, '**/*.md')) || [];
        var htmlFiles = glob.sync(path.join(CONF.docPath, '**/*.html')) || [];
        var files = mdFiles.concat(htmlFiles);
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

            var contentMt = searchContent(cutkeys, content);

            var searchCData = {
                path: it.replace(CONF.docPath, ''),
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
}

/**
 * 搜索
 * @param {String} conf 配置信息
 * @return {Function} 搜索方法
 * */
module.exports = function (conf) {
    CONF = conf;
    searchConf = CONF.searchConf || {};
    return {
        readCache: function () {
            var cacheDir = conf.cacheDir;

            // 缓存文件设置,如果是绝对路径,则使用绝对路径, 如果是相对路径,则计算出最终路径
            if (!path.isAbsolute(cacheDir)) {
                cacheDir = path.join(process.cwd(), cacheDir);
            }
            cache = fs.readJsonSync(cacheDir);
        },
        search: search
    };
};