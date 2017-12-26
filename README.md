# node-docx

> markdown文当平台，支持文件夹名配置，文档排序，浏览。

[![NPM Version](https://img.shields.io/npm/v/docx.svg)](https://npmjs.org/package/node-docx)
[![Linux Build](https://img.shields.io/travis/schoeu/docx/master.svg?label=linux)](https://travis-ci.org/schoeu/docx)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)
[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

## 快速开始

1. 下载docx库
```
git clone https://github.com/schoeu/docx.git
```

2. CD到docx目录下
```
cd docx
```

3. 安装依赖
```
npm install
```

4. 复制目录下的`map.example.json`到想要展示的文档目录下，然后按需要更改其中的信息，字段函数见最后[配置参数](#配置参数)

5. 在安装PM2的情况下 执行。其中`/xxx/map.json`就是刚才改过的配置文件的路径

```
pm2 start index.js -- /xxx/map.json
```

6. 验证

打开`http://你的机器:配置的端口号(默认为8910)`即可看到文档展示页面。



### 如果没有安装pm2

检测是否安装pm2，可以使用 pm2 -v查看，如果显示出版本号则说明pm2安装ok。

如果没有安装则使用`npm install -g pm2`来全局安装

## 使用示例

```
# 进入docx文件夹
cd docx

# 使用node命令启动或使用pm2启动查看效果
node index.js ./example/map.example.json

# or

pm2 start index.js -- ./example/map.example.json

```

## 本地测试&调试

复制一份`map.example.json`,更改参数配置,文件放置位置随意,配置参数具体意义参考下文。

```
cd docx
// 配置文件的路径,支持相对,绝对路径
npm start /xxx/map.json
```

## 说明

* 配置中的路径均支持相对路径与绝对路径。
* 启动应用时配置文件路径必填。
* docx有独立日志,日志路径可配置

## 配置参数

这里列出全部参数,除了`path`参数外,其他参数按需添加即可。

```
{
  // 监听端口,默认为8910,可选
  "port": "8910",

  // markdown文档的绝对路径, 默认为命令调起时配置文件路径的父目录。
  // 如 `pm2 start index.js -- /a/doc/map.json`  默认则取`/a/doc/`为文档目录, 如果配置有此属性,则以配置为准
  "path": "/home/work/docx",

  // 需要忽略的目录名,不能被markdown正确解析的目录都应该加到这里来,可选
  "ignoreDir": ["img",".git",".svn"],

  // 是否debug状态, 非debug状态会启用缓存,可选
  "debug": true,

  // header条标题,可选
  "headText": "PSFE-DOC",
  
  // 展示主题,可选, 开箱自带两套皮肤default,antd,默认为default.
  "theme": "default",
  
  // 预处理脚本定制,填写脚本路径即可,可选
  "preprocessscript":"",
    
  // page title,可选
  "title": "PSFE",

  // 默认文档路径,支持相对,绝对路径,可选
  "index": "/readme.md",

  // 是否启用拼音搜索, 启用后可以使用全拼或拼音首字母进行搜索, 可选, 默认为false
  "usePinyin": false,

  // 编辑页路径
  // 如果文档是存放至gitlab等类似的平台上, 对应的假如是"http://xx.xx.com/a/b/edit/master/first/second.md"
  // 则该属性为除去文件路由剩下的部分 "http://xx.xx.com/a/b/edit/master/", 有该属性后会在文档页添加跳转去编辑页的链接
  // "editPath": "http://xx.xx.com/a/b/edit/master/",

  // 技术支持,可选
  // 邮箱填写: mailto:xx@xxx.com
  // Hi填写: baidu://message/?id=用户名,可以直接调起Hi
  "supportInfo": "baidu://:xx@xxx.com",

  // 默认false, 开启报警后报错会发送邮件,可选
  "waringFlag": false,

  // 报警邮箱配置,可选
  "warningEmail": {
    "host": "smtp.163.com",
    "port": 25,
    "user": "xx@163.com",
    "pass": "password",
    "from": "xx@163.com", // 发件人
    "to": "xx@xxx.com", // 收件人
    "subject": "DOCX error"  // 邮件标题
  },
  
  // 文件夹命名配置文件路径,可选
  "dirsConfName": "map.json",

  // 链接配置,展示位置为右上角,可以配置其他链接,可选
  "extUrls": {
    "label": "友情链接",
    "links":[{
      "name": "栅格文档PMD",
      "url": "http://sfe.baidu.com/pmd/doc/"
    },{
      "name": "MIP文档",
      "url": "http://mip.baidu.com"
    },{
      "name": "SUPERFRAME文档",
      "url": "http://superframe.baidu.com"
    }]
  },
  // 文件夹命名配置，顺序即是文件夹展示的顺序
  "dirNames":[
         {"dir1": {
           "name": "dir1"
         }},
         {"dir2": {
           "name": "dir2"
         }},
         {"dir3": {
           "name": "dir3"
         }}
     ]
}

```

## 自定义文档树
有时我们会对遍历后的文档树做一些自定义处理，然后再展现出来。

```
var docx = require('./src/index');

docx.use('trees', function (data) {
    // 文档书数据处理
    //data.push(data[1]);
});
```

## 中间件
对于自定义路由，或其他数据数量等，我们提供了中间件机制。

```
docx.use('/user/:id', function (req, res, next) {
    console.log('Request Type:', req.method);
    next();
}


docx.use(function (req, res, next) {
    console.log('Time:', Date.now());
    next();
});

```


## 主题

开箱自带两套皮肤`default`,`antd`,默认为`default`主题。
目录为`themes/default`与`themes/antd`,如想换其他主题请自行替换或开发。
