/**
 * @file utils.js
 * @author schoeu
 * @description 工具模块
 * */

var fs = require('fs-extra');
var path = require('path');
var hbs = require('express-hbs');
var highlight = require('highlight.js');
var marked = require('marked');
var logger = require('./logger.js');
var config = require('./config');
var HBS_EXTNAME = 'hbs';
var compiledPageCache = {};

// 获取主题路径
var themePath = path.join(__dirname, '..', 'themes', config.get('theme'));
var themeViews = path.join(themePath, 'views');

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
     * @params {string} dir markdown文件的路径
     * @return {string} markdown文件大标题
     * */
    getMdTitle: function (dir) {
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
        else if (ext === '.html' || ext === '.htm') {
            titleArr = /<title>(.+?)<\/title>/.exec(content) || [];
            return titleArr[1] || '';
        }
        return '';
    },

    /**
     * markdown文件转html处理
     *
     * @param {string} content markdown字符串
     * @return {string} html字符串
     * */
    getMarked: function (content) {
        return marked(content);
    },

    /**
     * 配置处理
     *
     * @param {string} conf 配置文件相对路径
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
     * 获取文件目录树
     *
     * @params {string} dirs 文档根目录路径
     * @params {string} dirname 文档名称数据
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
            dirArr.forEach(function (it) {
                var childPath = path.join(dirs, it);
                var stat = fs.statSync(childPath);
                var relPath = childPath.replace(config.get('path'), '');
                // 如果是文件夹就递归查找
                if (stat.isDirectory()) {

                    // 如果是配置中忽略的目录,则跳过
                    if (ignorDor.indexOf(it) === -1) {
                        // 文件夹设置名称获取
                        var crtName = it || '';

                        for (var index = 0, length = confDirname.length; index < length; index++) {
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

        me.dirnameMap = dirnameMap;

        return {
            walkArr: walkArr,
            dirnameMap: dirnameMap
        };
    },

    /**
     * 根据配置对文档进行排序,暂支持根目录文件夹排序
     *
     * @param {Object} dirMap 文档结构数据
     * @param {Array} dirname 文件夹名字转换数据
     * @return {Object} rs 排序后的文档结构数组
     * */
    dirSort: function (dirMap, dirname) {
        var rs = [];
        var fileCtt = [];
        dirMap = dirMap || [];

        dirMap.map(function (it) {
            if (it.type === 'dir') {
                for (var idx = 0, length = dirname.length; idx < length; idx++) {
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
    },

    /**
     * 模板异步编译处理
     *
     * @param {string} pagePath 模板名
     * @param {Object} data 替换对象
     * @return {string} html字符串
     * */
    compilePre: function (pagePath, data) {
        data = data || {};

        // 缓存编译模板
        if (!compiledPageCache[pagePath])  {
            try {
                var compileStr = fs.readFileSync(path.join(themeViews, pagePath + '.' + HBS_EXTNAME)).toString();
                compiledPageCache[pagePath] = hbs.compile(compileStr);
            }
            catch (e) {
                logger.error(e);
                return '';
            }
        }
        return compiledPageCache[pagePath](data);
    },

    /**
     * 处理&组装面包屑数据
     *
     * @param {Array} breadcrumb 面包屑原始数据
     * @return {Array} 转换为中文的数据
     * */
    processBreadcrumb: function (breadcrumb) {
        var me = this;
        breadcrumb = breadcrumb || [];
        var dirMaps = [];
        breadcrumb.forEach(function (it) {
            if (it && it.indexOf('.md') < 0) {
                dirMaps.push(me.dirnameMap[it] || '');
            }
        });
        return dirMaps;
    },

    /**
     * 处理&组装面包屑数据
     *
     * @param {string} pathName 文件路径
     * @param {string} content markdown内容
     * @return {string} 转换为中文的HTML字符串
     * */
    getPjaxContent: function (pathName, content) {
        var me = this;
        var brandStr = '';
        var pathArr = pathName.split('/');
        var brandData = me.processBreadcrumb(pathArr);
        brandData.forEach(function (it) {
            brandStr += '<li>' + it + '</li>';
        });

        var rsHTML = me.compilePre('pjax', {brandData: brandStr, mdData: content, headText: config.get('headText')});
        return rsHTML;
    }
};
