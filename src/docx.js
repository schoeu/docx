/*
* @file docx.js
* */

var path = require('path');
var fs = require('fs');
var express = require('express');
var marked = require('marked');
var CONF = require('../docx-conf.json');

var app = express();
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
        app.set('views', path.join(__dirname, '..', 'views'));
        app.set('view engine', 'jade');

        app.get('/', function (req, res) {
            res.render('main', {navData: htmlStr});
        });

        app.listen(CONF.port || 8910);

        this.getDocTree();
    },

    getDocTree: function () {
        this.walker(CONF.path, dirMap);
        this.makeNav(dirMap);
        dirMap;
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
                    dirCtt[it] = {
                        type: 'dir',
                        path: relPath,
                        displayName: dirName.name || ''
                    };
                    dirCtt[it]['child'] = {};
                    me.walker(childPath, dirCtt[it]['child']);
                }
            }
            // 如果是文件
            else {
                if (path.extname(it) === '.md') {
                    var basename = path.basename(it, '.md');
                    dirCtt[basename] = {
                        type: 'md',
                        path: relPath,
                        title: me.getMdTitle(childPath)
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
                htmlStr += '<li data-path="' + item.path + '" class="nav nav-title">' + item.title + '</li>';
            }
            else if (item.type === 'dir') {
                htmlStr += '<li data-path="' + item.path + '" class="nav nav-dir"><div class="nav-name">' + item.displayName + '</div><ul>';
                this.makeNav(item.child);
                htmlStr += '</ul></li>';
            }
        }
    },

    getMdTitle: function(dir) {
        var content = fs.readFileSync(dir);
        var titleArr =  /^\s*\#+\s?(.+)/.exec(content.toString()) || [];
        return titleArr[1] || '';
    }
};

/*
* start
* */
new Docx();