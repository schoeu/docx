/*
* @file docx.js
* */

var express = require('express');
var path = require('path');
var app = express();


function Docx(options) {
    this.options = options || {};
    this.init();
}

Docx.prototype = {
    contributor: Docx,
    init: function () {
        var options = this.options;

        // express 视图设置
        app.set('views', path.join(__dirname, '..', 'views'));
        app.set('view engine', 'jade');

        app.get('/', this.render);

        app.listen(options.port || 8910);
    },
    render: function(req, res) {
        res.end('asdf');
    }

};


module.exports = Docx;