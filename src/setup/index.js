/**
 * @file index.js
 * @description 文档平台设置主文件
 * @author schoeu
 * */

var path = require('path');
var express = require('express');
var hbs = require('express-hbs');
var bodyParser = require('body-parser');


var HBS_EXTNAME = 'hbs';
var app = express();

module.exports = {
    start: function (port) {
        var viewsPath = path.join(__dirname, '../../', 'views');

        //app.enable('view cache');
        app.set('view engine', HBS_EXTNAME);
        app.set('views', viewsPath);
        app.engine('hbs', hbs.express4({
            partialsDir: viewsPath
        }));
        app.use(express.static(path.join(__dirname, '../../', 'public')));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: false}));
        routes();
        // 端口监听
        app.listen(port || 1110);
    }
};

// 路由设置
function routes() {
    // 文档主路径
    app.get('/', function (req, res) {
        res.render('index');
    });
}
