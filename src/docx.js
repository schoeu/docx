/*
* @file docx.js
* */

var express = require('express');
var path = require('path');
var fs = require('fs');
var marked = require('marked');
var app = express();
var CONF = require('../docx-conf.json');


var dirMap = {};

function Docx() {
    this.init();
}

Docx.prototype = {
    contributor: Docx,

    init: function () {
        // express 视图设置
        app.set('views', path.join(__dirname, '..', 'views'));
        app.set('view engine', 'jade');

        app.get('/', this.render);

        app.listen(CONF.port || 8910);

        this.getDocTree();
    },

    getDocTree: function () {
        var dirs = fs.readdirSync(CONF.path);

        this.makeTree(dirs, dirMap);
    },

    makeTree: function (dirs, dirCtt) {
        var me = this;
        dirs = dirs || [];
        dirs.forEach(function(it, i){
            var childPath = path.join(CONF.path, it);
            var stat = fs.statSync(childPath);

            // 如果是文件夹就递归查找
            if (stat.isDirectory()) {
               /* dirCtt[it] = [];
                var childDir = fs.readdirSync(childPath);
                me.makeTree(childDir);*/
            }
            // 如果是文件
            else {
                //dirCtt[it] = [];
                me.getMdTitle(childPath);
                return;
            }
        });
    },

    getMdTitle: function(dir) {
        var content = fs.readFileSync(dir);

        var titleArr = /^(#.+)\s+/g.exec(content.toString());
        console.log('titleArr', titleArr);
    },

    render: function(req, res) {
        res.end(marked('# 标题'));
    }

};

new Docx();