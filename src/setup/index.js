/**
 * @file index.js
 * @description 文档平台设置主文件
 * @author schoeu
 * */

var path = require('path');
var express = require('express');
var hbs = require('express-hbs');
var bodyParser = require('body-parser');
var pm2 = require('pm2');


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
    var docxPath = path.join(__dirname, '../server/index.js');

    // 文档主路径
    app.get('/', function (req, res) {
        res.render('index');
    });

    // 启动docx
    app.get('/setup/start', function (req, res) {
        pm2.connect(function(err) {
            if (err) {
                console.error(err);
                process.exit(2);
            }

            pm2.start({
                script    : docxPath,         // Script to be run
                exec_mode : 'fork',        // Allow your app to be clustered  cluster
                // instances : 4,                // Optional: Scale your app by 4
                max_memory_restart : '500M'   // Optional: Restart your app if it reaches 100Mo
            }, function(err, apps) {
                pm2.disconnect();   // Disconnect from PM2
                if (err) {
                    res.json({errno: 1, errmsg: err.toString()});
                    throw err
                }
                else {
                    res.json({errno: 0});
                }
            });
        });


    });

    // docx设置
    app.get('/setup/conf', function (req, res) {

        res.json({errno: 0});
    });
}
