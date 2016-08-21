/**
 * @file docx.js
 * @author schoeu
 * */

var path = require('path');
var fs = require('fs');
var child = require('child_process');
var url = require('url');
var express = require('express');
var marked = require('marked');
var CONF = require('../docx-conf.json');
var highlight = require('highlight.js');

var app = express();
var exphbs  = require('express-handlebars');
var ignorDor = CONF.ignoreDir || [];

var dirMap = {};
var htmlStr = '';
var headText = CONF.headText || '';
var locals = {
    headText: headText,
    title: CONF.title || headText
};
var links = CONF.links || [];

function Docx() {
    this.init();
}

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

        // 路由处理
        me.routes(app);

        app.listen(CONF.port || 8910);
        me.getDocTree();
    },

    /**
     * 系统的路由定义
     * */
    routes: function () {
        var me = this;

        // 首页路由
        /*app.get('/', function (req, res) {
            var parseObj = Object.assign({}, locals, {links: links});
            res.render('index', parseObj);
        });*/

        // 文档主路径
        // app.get('/doc', function (req, res) {
        app.get('/', function (req, res) {
            // var parseObj = Object.assign({}, locals, {navData: htmlStr});
            // res.render('main', parseObj);
            res.redirect(CONF.index);
        });

        // API: 获取最近更新的文件列表
        app.get('/lastestfiles', function (req, res) {
            var files = me.getLastestFile();
            res.json({
                errorno: 0,
                files: files
            });
        });

        // markdown文件路由
        app.get('/*.md', function (req, res) {
            var relativePath = url.parse(req.originalUrl);
            var mdPath = path.join(CONF.path, relativePath.pathname);
            if (mdPath.indexOf('.md') > -1) {
                var file = fs.readFileSync(mdPath);

                // markdown转换成html
                var content = me.getMarked(file.toString());

                // 判断是pjax请求则返回html片段
                if (req.headers['x-pjax'] === 'true') {
                    res.end(content);
                }
                // 否则返回整个模板
                else {
                    var parseObj = Object.assign({}, locals, {navData: htmlStr, mdData: content});
                    res.render('main', parseObj);
                }
            }
        });
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
        this.walker(CONF.path, dirMap);
        this.makeNav(dirMap);
    },

    /**
     * 获取文件目录树
     *
     * @param {String} 文件起始路径
     * @param {Object} 文件目录树容器
     * */
    walker: function (dirs, dirCtt) {
        var me = this;
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
                    if (dirName.name) {
                        dirCtt[it] = {
                            type: 'dir',
                            path: relPath,
                            displayName: dirName.name || ''
                        };
                        dirCtt[it]['child'] = {};
                        me.walker(childPath, dirCtt[it]['child']);
                    }
                }
            }
            // 如果是文件
            else {
                if (path.extname(it) === '.md') {
                    var basename = path.basename(it, '.md');
                    var title = me.getMdTitle(childPath);
                    dirCtt[basename] = {
                        type: 'md',
                        path: relPath,
                        title: title
                    };
                }
            }
        });
    },

    /**
     * 根据文件目录数据组装文件html
     *
     * @param {Array} dirs 文件目录数组
     * */
    makeNav: function (dirs) {
        if (!dirs) {
            return false;
        }
        for(var i in dirs) {
            var item = dirs[i] || {};
            if (item.type === 'md') {
                htmlStr += '<li class="nav nav-title" data-path="' + item.path + '"><a href="' + item.path + '" data-pjax="true"><i class="iconfont">&#xe61a;</i><span class="nav-filename">' + item.title + '</span></a></li>';
            }
            else if (item.type === 'dir') {
                htmlStr += '<li data-dir="' + item.path + '" class="nav nav-dir"><div class="nav-name link"><i class="iconfont">&#xe61f;</i><span class="nav-disname">' + item.displayName + '</span></div><ul class="docx-submenu">';
                this.makeNav(item.child);
                htmlStr += '</ul></li>';
            }
        }
    },

    /**
     * 获取markdown文件大标题
     *
     * @param {String} markdown文件的路径
     * @return {String} markdown文件大标题
     * */
    getMdTitle: function(dir) {
        if (dir) {
            var content = fs.readFileSync(dir);
            var titleArr =  /^\s*\#+\s?(.+)/.exec(content.toString()) || [];
            return titleArr[1] || '';
        }
        return '';
    },

    /**
     * 获取最新更新文件的实现,之后做跨平台兼容
     *
     * @return {Array} fileNames 更改过文件的路径数组
     * */
    getLastestFile: function () {
        var me = this;
        var findFile;
        var fileNames = [];
        var execRs = child.execSync('find ' + CONF.path + ' -name "*.md" -mtime 0');
        if (execRs) {
            findFile = execRs.toString();
        }
        var fileArr = findFile.split('\n') || [];
        fileArr.forEach(function (it) {
            var title = me.getMdTitle(it);
            if (title) {
                fileNames.push(title);
            }
        });

        return fileNames;
    }
};

/**
 * 初始化docx
 * */
new Docx();