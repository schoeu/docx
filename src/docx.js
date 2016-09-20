/**
 * @file docx.js
 * @author schoeu
 * */

var path = require('path');
var fs = require('fs');
var url = require('url');
var express = require('express');
var bodyParser = require('body-parser');
var marked = require('marked');
var pinyinlite = require('pinyinlite');
var highlight = require('highlight.js');
var glob = require('glob');
var _ = require('lodash');
var serve_static = require('serve-static');
var exphbs  = require('express-handlebars');

var CONF = require('../docx-conf.json');
var warning = require('./warning.js');
var update = require('./update.js');
var search = require('./search.js');
var utils = require('./utils.js');

var app = express();
var ignorDor = CONF.ignoreDir || [];

var htmlStr = '';
var headText = CONF.headText || '';
var headParts = headText.split('-') || [];
var locals = {
    headMain: headParts[0] || '',
    headSub: headParts[1] || '',
    title: CONF.title || headText,
    links: CONF.extUrls.links || [],
    surposEmail: CONF.surposEmail || '',
    label: CONF.extUrls.label
};

function Docx() {
    this.init();
}

var htmlCodes = [
    '<div class="row">',
    '        <ol class="breadcrumb">',
    '            <li>' + headText + '</li>',
    '                {{brandData}}',
    '        </ol>',
    '    </div>',
    '    <div class="row">',
    '        <div class="col-lg-12 docx-fade">',
    '            <div class="docx-panel docx-panel-default">',
    '                <div class="markdown-body">',
    '                    <div class="docx-marked">',
    '                        {{mdData}}',
    '                    </div>',
    '                </div>',
    '            </div>',
    '        </div>',
    '    </div>'
].join('');

Docx.prototype = {
    contributor: Docx,

    /**
     * 初始化DOCX,主要初始化了express
     * */
    init: function () {
        var me = this;

        // 文件夹命名设置默认为空
        me.dirname = {};

        // express 视图设置
        if (!CONF.debug) {
            app.enable('view cache');
        }

        app.set('views', path.join(__dirname, '..', 'views'));
        app.engine('.hbs', exphbs({extname: '.hbs'}));
        app.set('view engine', '.hbs');
        app.use(express.static(path.join(__dirname, '..', 'public')));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        // 在构建doctree前解析文件名命令配置
        var dirsConf = path.join(CONF.path, CONF.dirsConfName || 'map.json');
        try {
            var stat = fs.statSync(dirsConf);
            if (stat) {
                me.dirname = require(dirsConf);
            }
        }
        catch (e) {}

        // 根据文档获取文档结构树
        me.getDocTree();

        // 路由处理
        me.routes();

        // 容错处理
        app.use(function(err, req, res, next) {
            // 如果开启了错误邮件报警则发错邮件
            if (err && CONF.waringFlag) {
                warning.sendMail(err.toString());
            }
        });

        // 端口监听
        app.listen(CONF.port || 8910);
    },

    /**
     * 系统的路由定义
     * */
    routes: function () {
        var me = this;

        // 文档主路径
        app.get('/', function (req, res) {
            res.redirect(CONF.index);
        });

        // markdown文件路由
        app.get(/.+.md$/, me.mdHandler.bind(me));

        // API: 搜索功能
        app.post('/api/search', function (req, res) {
            var key = req.body.name;
            var searchType = req.body.type;
            var searchRs = search(searchType, key);

            // 搜索成功,返回内容
            res.json({
                data: searchRs
            });
        });

        // API: 文档更新钩子
        app.all('/api/update', update);

        // 委托其他静态资源
        app.use('/', serve_static(CONF.path));
    },

    /**
     * 处理&组装面包屑数据
     * @param {String} pathName 文件路径
     * @param {String} content markdown内容
     * @return {String} 转换为中文的HTML字符串
     * */
    getPjaxContent: function (pathName, content) {
        var me = this;
        var brandStr = '';
        var pathArr = pathName.split('/');
        var brandData = me.processBreadcrumb(pathArr);
        brandData.forEach(function (it) {
            brandStr += '<li>' + it + '</li>';
        });
        var rsHTML = htmlCodes.replace('{{brandData}}', brandStr).replace('{{mdData}}', content);
        return rsHTML;
    },

    /**
     * 处理mardown文档请求
     * @param {Object} req 请求对象
     * @param {Object} res 相应对象
     * */
    mdHandler: function (req, res) {
        var me = this;
        var relativePath = url.parse(req.originalUrl);
        var pathName = relativePath.pathname || '';

        var mdPath = path.join(CONF.path, pathName);
        mdPath = decodeURIComponent(mdPath);
        fs.stat(mdPath, function (err, stat) {
            stat && fs.readFile(mdPath, 'utf8', function (err, file) {
                if (file) {
                    // markdown转换成html
                    var content = me.getMarked(file.toString());

                    // 判断是pjax请求则返回html片段
                    if (req.headers['x-pjax'] === 'true') {
                        var rsPjaxDom = me.getPjaxContent(pathName, content);
                        res.end(rsPjaxDom);
                    }

                    // 否则返回整个模板
                    else {
                        var parseObj = Object.assign({}, locals, {navData: htmlStr, mdData: content});
                        res.render('main', parseObj);
                    }
                }
            });
        });
    },

    /**
     * 处理&组装面包屑数据
     * @param {Array} breadcrumb 面包屑原始数据
     * @return {Array} 转换为中文的数据
     * */
    processBreadcrumb: function(breadcrumb) {
        var me = this;
        breadcrumb = breadcrumb || [];
        var dirMaps = [];
        breadcrumb.forEach(function (it) {
            if (it && it.indexOf('.md') < 0) {
                var nameMap = me.dirname[it] || {};
                dirMaps.push(nameMap.name || '');
            }
        });
        return dirMaps;
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
    },

    /**
     * 获取文件目录树
     * */
    getDocTree: function () {
        // 根据markdown文档生成文档树
        var dirMap = this.walker(CONF.path);

        // 根据配置规则对文档进行排序
        var dirRsMap = this.dirSort(dirMap);

        // 根据排序后的文档树数据生成文档DOM
        this.makeNav(dirRsMap);
    },

    /**
     * 获取文件目录树
     *
     * @param {String} 文档根目录路径
     * @return {Object} 文件目录树
     * */
    walker: function (dirs) {
        var me = this;
        var testArr = [];
        docWalker(dirs, testArr);
        function docWalker(dirs, dirCtt) {
            var dirArr = fs.readdirSync(dirs);
            dirArr = dirArr || [];
            dirArr.forEach(function(it) {
                var childPath = path.join(dirs, it);
                var stat = fs.statSync(childPath);
                var relPath = childPath.replace(CONF.path, '');
                // 如果是文件夹就递归查找
                if (stat.isDirectory()) {

                    // 如果是配置中忽略的目录,则跳过
                    if (ignorDor.indexOf(it) === -1) {
                        var dirName = me.dirname[it] || {};
                        // 如果没有配置文件夹目录名称,则不显示
                        var childArr = [];
                        dirCtt.push({
                            itemName: it,
                            type: 'dir',
                            path: relPath,
                            displayName: dirName.name || it ||'',
                            child: childArr
                        });
                        docWalker(childPath, childArr);
                    }
                }
                // 如果是文件
                else {

                    if (/^\.md$|html$|htm$/i.test(path.extname(it))) {
                        var basename = path.basename(it, path.extname(it));
                        var title = utils.getMdTitle(childPath);
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
        return testArr;
    },

    /**
     * 根据文件目录数据组装文件html
     *
     * @param {Array} dirs 文件目录数组
     * */
    makeNav: function (dirs) {
        if (Array.isArray(dirs) && dirs.length) {
            for(var i = 0; i< dirs.length; i++) {
                var item = dirs[i] || {};
                if (!item) {
                    continue;
                }
                if (item.type === 'file') {
                    htmlStr += '<li class="nav nav-title docx-files" data-path="' + item.path + '" data-title="' + item.title + '"><a href="' + item.path + '">' + item.title + '</a></li>';
                }
                else if (item.type === 'dir') {
                    htmlStr += '<li data-dir="' + item.path + '" data-title="' + item.displayName + '" class="docx-dir"><a href="#" class="docx-dirsa">' + item.displayName + '<span class="fa arrow"></span></a><ul class="docx-submenu">';
                    this.makeNav(item.child);
                    htmlStr += '</ul></li>';
                }
            }
        }
    },

    /**
     * 根据配置对文档进行排序,暂支持根目录文件夹排序
     *
     * @param {Object} map 文档结构数据
     * @return {Object} rs 排序后的文档结构数组
     * */
    dirSort: function (map) {
        var me = this;
        map = map || [];
        var dirname = me.dirname || {};
        if (!_.isEmpty(dirname)) {
            var sortMap = [];
            var rs = [];
            var fileArr = [];
            map.forEach(function (it) {
                var item = dirname[it.itemName] || {};
                if (it.type !== 'dir') {
                    item.sort = 0;
                }
                sortMap.push(item.sort || 0);
            });

            sortMap.sort(function (a, b) {return a - b});

            map.forEach(function (it) {
                var itemName = dirname[it.itemName] || {};
                var sortNum = itemName.sort || 0;
                if (it.type !== 'dir') {
                    fileArr.push(it);
                }
                else {
                    var index = sortMap.indexOf(sortNum);
                    rs[index] = it;
                }
            });

            return fileArr.concat(rs);
        }
        return map;
    }
};

/**
 * 初始化docx
 * */
new Docx();