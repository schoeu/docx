/**
 * @file index.js
 * @description 文档平台主文件
 * @author schoeu
 * */

var path = require('path');
var fs = require('fs-extra');
var url = require('url');
var child_process = require('child_process');
var LRU = require("lru-cache");
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');
var hbs = require('express-hbs');

// 初始化日志
var config = require('./config');
var warning = require('./warning.js');
var utils = require('./utils.js');
var logger = require('./logger.js');

// 文件预处理
var preprocessor = require('./preprocessor.js');
var search = require('./search.js');
var cache = LRU({max: 500});

var app = express();

var htmlStr = '';
var HBS_EXTNAME = 'hbs';

/**
 * Docx构造函数
 *
 * @param {String} conf 配置文件相对路径
 * */
function Docx() {
    // 初始化docx
    this.init();
}

var errorType = {'notfound': '/images/notfound.png', 'othererror': '/images/othererror.png'};

Docx.prototype = {
    contributor: Docx,

    /**
     * 初始化DOCX,主要初始化了express,日志模块, 预处理模块, 路由绑定等
     * */
    init: function () {
        var me = this;

        // 获取配置
        var docPath = config.get('docPath');

        if (!docPath) {
            throw new Error('not valid conf file.');
        }
        else {
            // 文件绝对&相对路径兼容
            if (!path.isAbsolute(docPath)) {
                docPath = path.join(process.cwd(), docPath);
            }
        }


        // 文件预处理
        preprocessor();

        // 文件夹命名设置默认为空
        me.dirname = [];

        // 公共变量处理
        var headText = config.get('headText');
        me.locals = {
            headText: headText,
            title: config.get('title') || headText,
            links: config.get('extUrls').links || [],
            supportInfo: config.get('supportInfo'),
            label: config.get('extUrls').label
        };

        // 读取缓存,用于搜索
        search.readCache();

        // express 视图缓存
        if (!config.get('debug')) {
            app.enable('view cache');
        }

        var themePath = path.join(__dirname, '..', 'themes', config.get('theme'));
        me.themePath = path.join(themePath, 'views');

        app.engine('hbs', hbs.express4({
            partialsDir: me.themePath
        }));
        app.set('view engine', HBS_EXTNAME);
        app.set('views', me.themePath);

        app.use(express.static(path.join(themePath, 'static')));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: false}));

        // 在构建doctree前解析文件名命令配置
        //config.refresh();
        me.dirname = utils.getDirsConf();

        // 根据文档获取文档结构树
        me.getDocTree();

        // 路由处理
        me.routes();

        // 端口监听
        app.listen(config.get('port') || 8910);
    },

    /**
     * 系统的路由定义
     * */
    routes: function () {
        var me = this;

        // 文档主路径
        app.get('/', function (req, res) {
            res.redirect(config.get('index'));
        });

        // markdown文件路由
        app.get(/.+.md$/, me.mdHandler.bind(me));

        // API: 搜索功能
        app.post('/api/search', function (req, res) {
            var key = req.body.name;
            var searchType = req.body.type;
            var searchRs = search.search(searchType, key);

            // 搜索成功,返回内容
            res.json({
                data: searchRs
            });
        });

        // API: 文档更新钩子
        app.all('/api/update', me.update.bind(me));

        // 委托其他静态资源
        app.use('/', express.static(config.get('docPath')));

        app.all('/settings/', function () {

        });


        // 路由容错处理
        app.get('*', function (req, res) {
            var time = Date.now();
            var ua = req.headers['user-agent'] || '';
            // 错误页面
            var errPg = utils.compilePre('error', {errorType: errorType['notfound']});
            var errPgObj = Object.assign({}, me.locals, {navData: htmlStr, mdData: errPg});
            res.render('main', errPgObj);
            logger.error({access: req.url, isCache: false, error: 'notfound', referer: req.headers.referer, ua: ua, during: Date.now() - time + 'ms'});
        });

        // 容错处理
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            // 错误页面
            var errPg = utils.compilePre('error', {errorType: errorType['othererror']});
            var errPgObj = Object.assign({}, me.locals, {navData: htmlStr, mdData: errPg});
            res.render('main', errPgObj);
            logger.error(err);
            // 如果邮件报警开启,则初始化邮件报警模块
            if (config.get('waringFlag')) {
                warning(err.toString());
            }
        });
    },


    /**
     * 处理mardown文档请求
     * @param {Object} req 请求对象
     * @param {Object} res 相应对象
     * */
    mdHandler: function (req, res, next) {
        var me = this;
        var headers = req.headers;
        var ua = headers['user-agent'] || '';
        var time = Date.now();

        var relativePath = url.parse(req.originalUrl);
        var pathName = relativePath.pathname || '';
        var mdPath = path.join(config.get('docPath'), pathName);
        var isPjax = headers['x-pjax'] === 'true';
        mdPath = decodeURIComponent(mdPath);
        fs.readFile(mdPath, 'utf8', function (err, file) {
            var content = '';
            if (file) {
                // 请求页面是否在缓存中
                var hasCache = cache.has(pathName);

                if(hasCache) {
                    content = cache.get(pathName);
                }
                else  {
                    // markdown转换成html
                    content = utils.getMarked(file.toString());

                    // 有内容才缓存
                    content && cache.set(pathName, content);
                }

                // 判断是pjax请求则返回html片段
                if (isPjax) {
                    var rsPjaxDom = utils.getPjaxContent(pathName, content);
                    res.end(rsPjaxDom);
                }
                // 否则返回整个模板
                else {
                    var parseObj = Object.assign({}, me.locals, {navData: htmlStr, mdData: content});
                    res.render('main', parseObj);
                }
                logger.info({'access:': pathName, 'isCache:': hasCache, error: null, referer: headers.referer, ua: ua, during: Date.now() - time + 'ms'});
            }
            // 如果找不到文件,则返回错误提示页
            else if (err) {
                // 错误页面
                var errPg = utils.compilePre('error', {errorType: errorType['notfound']});

                // 判断是pjax请求则返回html片段
                if (isPjax) {
                    res.end(utils.getPjaxContent(pathName, errPg));
                }
                // 否则返回整个模板
                else {
                    var errPgObj = Object.assign({}, me.locals, {navData: htmlStr, mdData: errPg});
                    res.render('main', errPgObj);
                }
                logger.error(err);
            }
        });
    },

    /**
     * 获取文件目录树
     * */
    getDocTree: function () {
        var me = this;
        // 根据markdown文档生成文档树
        var walkData = utils.walker(config.get('docPath'), me.dirname);
        var dirMap = walkData.walkArr;
        me.dirnameMap = walkData.dirnameMap;
        // 数据排序处理
        var sortedData = utils.dirSort(dirMap, me.dirname);

        // 根据排序后的文档树数据生成文档DOM
        htmlStr = '';
        this.makeNav(sortedData);
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
     * 文档更新钩子
     *
     * @param {Object} req 请求对象
     * @return {Object} res 响应对象
     * */
    update: function (req, res) {
        var me = this;
        var time = Date.now();

        // 更新代码
        child_process.exec('git pull', {
            cwd: config.get('docPath')
        }, function (err, result) {
            // 清除lru缓存
            cache.reset();

            // 重新生成搜索缓存文件
            preprocessor();

            // 更新文件名命令配置
            me.dirname = utils.getDirsConf();

            // 重新生成DOM树
            me.getDocTree();

            // 重新读取缓存,用于刷新搜索
            search.readCache();

            // 清除文件缓存
            logger.info({message: 'update cache.json', during: Date.now() - time + 'ms'});

            if (err) {
                logger.error(err);
            }
            res.end('update cache.');
        });
    }
};

module.exports = Docx;
