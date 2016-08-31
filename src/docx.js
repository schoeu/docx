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
var highlight = require('highlight.js');
var glob = require('glob');
var serve_static = require('serve-static');
var exphbs  = require('express-handlebars');

var CONF = require('../docx-conf.json');
var searchConf = CONF.searchConf || {};
var warning = require('./warning.js');
var update = require('./update.js');

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
    '            <div class="panel panel-default">',
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
        app.get('/*.md', function (req, res) {
            var relativePath = url.parse(req.originalUrl);
            var pathName = relativePath.pathname || '';
            var mdPath = path.join(CONF.path, pathName);
            if (mdPath) {
                mdPath = decodeURIComponent(mdPath);
            }

            // var file = fs.readFileSync(mdPath);
            fs.readFile(mdPath, 'utf8', function (err, file) {
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
            });
        });

        // API: 搜索功能
        app.post('/api/search', function (req, res) {
            var searchRs = [];
            var key = req.body.name;
            var searchType = req.body.type;
            var keyLength = key.length || 0;
            var files = glob.sync(path.join(CONF.path, '**/*.md')) || [];
            var titleReg = /^\s*\#+\s?(.+)/;
            var reg = new RegExp(key,'img');
            if (keyLength) {
                files.forEach(function (it) {
                    if (it) {
                        it = decodeURIComponent(it);
                    }
                    var content = fs.readFileSync(it).toString();
                    var titleArr =  titleReg.exec(content) || [];
                    var titleStr = titleArr[1] || '';
                    var replacedStr = '';
                    var titleMatch = '';
                    var matchContent = [];
                    if (reg.test(titleStr)) {
                        // 飘红title关键字
                        titleMatch = titleStr.replace(reg, function (m) {
                            return '<span class="hljs-string">' + m + '</span>';
                        });
                    }

                    // 飘红title关键字
                    replacedStr = titleStr.replace(reg, function (m) {
                        return '<span class="hljs-string">' + m + '</span>';
                    });

                    if (searchType !== 'title') {
                        var matchIdx = 0;
                        var lastIndex = 0;
                        var lastestIdx = lastIndex;
                        for(;(lastIndex = content.indexOf(key, lastIndex + keyLength)) > 0;) {
                            if ((matchIdx < searchConf.matchDeep) && (lastIndex - lastestIdx > searchConf.matchWidth)) {

                                // 匹配结果位置在配置范围内的则忽略,以防多次截取相同范围内容
                                var matched = content.substring(lastIndex - searchConf.matchWidth, lastIndex + searchConf.matchWidth + keyLength);

                                // 飘红内容关键字
                                var rpStr = matched.replace(/\s/img, '').replace(/[<>]/g,'').replace(reg, function (m) {
                                    return '<span class="hljs-string">' + m + '</span>';
                                });

                                // 保存匹配结果
                                matchContent.push(rpStr + '...');
                                matchIdx ++;
                                lastestIdx = lastIndex;
                            }
                        }
                    }
                    if (titleMatch || matchContent.length) {
                        searchRs.push({
                            path: it.replace(CONF.path, ''),
                            title: matchContent.length ? replacedStr : titleMatch,
                            content: matchContent.toString()
                        });
                    }
                });

                // 搜索成功,返回内容
                res.json({
                    error: 0,
                    data: searchRs
                });
            }
        });

        // API: 文档更新钩子
        app.get('/api/update', update);

        // 委托其他静态资源
        app.use('/', serve_static(CONF.path));
    },

    /**
     * 处理&组装面包屑数据
     * @param {String} pathName 文件路径
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
     * 处理&组装面包屑数据
     * @param {Array} breadcrumb 面包屑原始数据
     * @return {Array} 转换为中文的数据
     * */
    processBreadcrumb: function(breadcrumb) {
        breadcrumb = breadcrumb || [];
        var dirMaps = [];
        breadcrumb.forEach(function (it) {
            if (it) {
                if (it.indexOf('.md') > -1) {
                }
                else {
                    var nameMap = CONF.dirname[it] || {};
                    dirMaps.push(nameMap.name || '');
                }
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
     * @param {String} 文件起始路径
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
                        var dirName = CONF.dirname[it] || {};
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
                    if (/^\.md$/i.test(path.extname(it))) {
                        var basename = path.basename(it, '.md');
                        var title = me.getMdTitle(childPath);
                        dirCtt.push({
                            itemName: basename,
                            type: 'md',
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
                if (item.type === 'md') {
                    htmlStr += '<li class="nav nav-title docx-files" data-path="' + item.path + '" data-title="' + item.title + '"><a href="' + item.path + '">' + item.title + '</a></li>';
                }
                else if (item.type === 'dir') {
                    htmlStr += '<li data-dir="' + item.path + '" data-title="' + item.displayName + '" class="docx-dir"><a href="#">' + item.displayName + '<span class="fa arrow"></span></a><ul class="docx-submenu">';
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
        map = map || [];
        var dirname = CONF.dirname || {};
        var sortMap = [];
        var rs = [];
        map.forEach(function (it) {
            var item = dirname[it.itemName] || {};
            if (it.type !== 'dir') {
                item.sort = 0;
            }
            sortMap.push(item.sort || 0);
        });

        sortMap.sort(function (a, b) {return a - b});

        map.forEach(function (it, i) {
            var itemName = dirname[it.itemName] || {};
            var sortNum = itemName.sort || 0;
            if (it.type !== 'dir') {
                sortNum = 0;
            }
            var index = sortMap.indexOf(sortNum);
            rs[index] = it;
        });

        return rs;
    },

    /**
     * 获取markdown文件大标题
     *
     * @param {String} markdown文件的路径
     * @return {String} markdown文件大标题
     * */
    getMdTitle: function(dir) {
        if (dir) {
            dir = decodeURIComponent(dir);
            var content = fs.readFileSync(dir);
            var titleArr =  /^\s*\#+\s?(.+)/.exec(content.toString()) || [];
            return titleArr[1] || '';
        }

        return '';
    }
};

/**
 * 初始化docx
 * */
new Docx();