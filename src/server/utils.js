/**
 * @file utils.js
 * @author schoeu
 * */

var fs = require('fs-extra');
var path = require('path');
var highlight = require('highlight.js');
var marked = require('marked');
var config = require('../config');

// markdown中渲染代码高亮处理
marked.setOptions({
    highlight: function (code, lang) {
        return highlight.highlightAuto(code).value;
    }
});

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
            // /^\s*\#+\s?(.+)/
            // /^\s*#+\s?([^#\s]+)/
            // /^\s*\#+\s?([^\#]+)\s*\#?/
            titleArr =  /^\s*#+\s?([^#\r\n]+)/.exec(content) || [];
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
        return marked(content);
    },

    /**
     * 配置处理
     *
     * @param {String} conf 配置文件相对路径
     * @return {undefined}
     * */
    getConf: function (conf) {

        conf = conf ? conf : './docx-conf.json';

        // 配置文件设置,如果是绝对路径,则使用绝对路径,如果是相对路径,则计算出最终路径
        if (!path.isAbsolute(conf)) {
            conf = path.join(process.cwd(), conf);
        }

        // 读取配置内容
        var json = fs.readJsonSync(conf);

        return json || '';
    },

    /**
     * 更新文件夹名配置缓存
     *
     * @return {Array} dirname
     * */
    getDirsConf: function () {
        var dirname = [];

        var dirsConf = path.join(config.get('docPath'), config.get('dirsConfName'));
        try {
            var stat = fs.statSync(dirsConf);
            if (stat) {
                dirname = fs.readJsonSync(dirsConf);
            }
        }
        catch (e) {}

        return dirname;
    },

    /**
     * 获取文件目录树
     *
     * @param {String} 文档根目录路径
     * @return {Object} 文件目录树
     * */
    walker: function (dirs, dirname) {
        var me = this;
        var walkArr = [];
        var dirnameMap = {};
        var confDirname = dirname || [];
        var ignorDor = config.get('ignoreDir');
        docWalker(dirs, walkArr);
        function docWalker(dirs, dirCtt) {
            var dirArr = fs.readdirSync(dirs);
            dirArr = dirArr || [];
            dirArr.forEach(function(it) {
                var childPath = path.join(dirs, it);
                var stat = fs.statSync(childPath);
                var relPath = childPath.replace(config.get('docPath'), '');
                // 如果是文件夹就递归查找
                if (stat.isDirectory()) {

                    // 如果是配置中忽略的目录,则跳过
                    if (ignorDor.indexOf(it) === -1) {
                        // 文件夹设置名称获取
                        var crtName = it || '';

                        for(var index=0, length=confDirname.length; index<length; index++) {
                            var dnItems = confDirname[index];
                            if (dnItems[it]) {
                                crtName = dnItems[it].name;
                                dirnameMap[it] = crtName;
                                break;
                            }
                        }

                        // 如果没有配置文件夹目录名称,则不显示
                        var childArr = [];
                        dirCtt.push({
                            itemName: it,
                            type: 'dir',
                            path: relPath,
                            displayName: crtName,
                            child: childArr
                        });
                        docWalker(childPath, childArr);
                    }
                }
                // 如果是文件
                else {

                    if (/^\.md$|html$|htm$/i.test(path.extname(it))) {
                        var basename = path.basename(it, path.extname(it));
                        var title = me.getMdTitle(childPath);
                        dirCtt.push({
                            itemName: basename,
                            type: 'file',
                            path: relPath,
                            title: title
                        });
                    }
                }
            });
        }
        return {
            walkArr: walkArr,
            dirnameMap: dirnameMap
        };
    },

    /**
     * 根据配置对文档进行排序,暂支持根目录文件夹排序
     *
     * @param {Object} map 文档结构数据
     * @return {Object} rs 排序后的文档结构数组
     * */
    dirSort: function (dirMap, dirname) {
        var rs = [];
        var fileCtt = [];
        dirMap = dirMap || [];

        dirMap.map(function (it) {
            if (it.type === 'dir') {
                for(var idx=0, length=dirname.length; idx<length; idx++) {
                    var item = dirname[idx];
                    if (item[it.itemName]) {
                        var matchedName = it;
                        rs[idx] = matchedName;
                        break;
                    }
                }
            }
            else {
                fileCtt.push(it);
            }
        });
        // 合并数据,文档最前
        return fileCtt.concat(rs);
    }
};