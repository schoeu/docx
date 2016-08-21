/*
 * @file docx.js
 * */

var path = require('path');
var fs = require('fs');
var child = require('child_process');
var url = require('url');
var express = require('express');
var marked = require('marked');
var CONF = require('../docx-conf.json');
var glob = require('glob');
var highlight = require('highlight.js');

var app = express();
var exphbs  = require('express-handlebars');
var ignorDor = CONF.ignoreDir || [];

var dirMap = {};
var htmlStr = '';

function Docx() {
    this.init();
}

Docx.prototype = {
    contributor: Docx,

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

        app.get('/doc', function (req, res) {
            res.render('doc', {navData: htmlStr});
        });

        app.get('/lastestfiles', function (req, res) {
            var files = me.getLastestFile();
            res.json({
                errorno: 0,
                file: files
            });
        });

        app.get('/*.md', function (req, res) {
            var relativePath = url.parse(req.originalUrl);
            var mdPath = path.join(CONF.path, relativePath.pathname);
            if (mdPath.indexOf('.md') > -1) {
                var file = fs.readFileSync(mdPath);

                var content = me.getMarked(file.toString());
                if (req.headers['x-pjax'] === 'true') {
                    res.end(content);
                }
                else {
                    res.render('doc', {navData: htmlStr, mdData: content});
                }
            }
        });

        app.listen(CONF.port || 8910);
        this.getDocTree();
    },

    getMarked: function (content) {
        var renderer = new marked.Renderer();
        // 渲染代码
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

    getDocTree: function () {
        this.walker(CONF.path, dirMap);
        this.makeNav(dirMap);
    },

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
<<<<<<< HEAD
                htmlStr += '<li data-path="' + item.path + '" class="nav nav-dir"><div class="nav-name link"><i class="iconfont">&#xe61f;</i><span class="nav-disname">' + item.displayName + '</span></div><ul class="docx-submenu">';
=======
                htmlStr += '<li data-dir="' + item.path + '" class="nav nav-dir"><div class="nav-name link"><i class="iconfont">&#xe61f;</i><span class="nav-disname">' + item.displayName + '</span></div><ul class="docx-submenu">';
>>>>>>> newer
                this.makeNav(item.child);
                htmlStr += '</ul></li>';
            }
        }
    },

    getMdTitle: function(dir) {
        var content = fs.readFileSync(dir);
        var titleArr =  /^\s*\#+\s?(.+)/.exec(content.toString()) || [];
        return titleArr[1] || '';
    },

    getLastestFile: function () {
        var me = this;
        var findFile;
        var fileNames = [];
        var execRs = child.execSync('find ' + CONF.path + ' -name "*.md" -mtime 0');
        if (execRs) {
            findFile = execRs.toString();
        }
        var fileArr = findFile.split('\n') || [];
        fileArr.shift();
        fileArr.pop();
        fileArr.forEach(function (it) {
            var title = me.getMdTitle(it);
            fileNames.push(title);
        });

        return fileNames;
    }
};

/*
 * start
 * */
new Docx();