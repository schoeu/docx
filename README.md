# node-docx

> markdown文当平台，支持文件夹名配置，文档排序，浏览。

[![NPM Version](https://img.shields.io/npm/v/docx.svg)](https://npmjs.org/package/node-docx)
[![Linux Build](https://img.shields.io/travis/schoeu/docx/master.svg?label=linux)](https://travis-ci.org/schoeu/docx)
[![Windows Build](https://img.shields.io/appveyor/ci/schoeu/docx/master.svg?label=windows)](https://ci.appveyor.com/project/schoeu/docx)
[![Test Coverage](https://img.shields.io/coveralls/schoeu/docx/master.svg)](https://coveralls.io/r/schoeu/docx?branch=master)
[![star](https://img.shields.io/github/stars/schoeu/docx.svg?style=social&label=Star)](https://github.com/schoeu/docx/stargazers)
[![Follow](https://img.shields.io/github/followers/schoeu.svg?style=social&label=Follow)](https://github.com/schoeu)


## 安装

```
npm install node-docx
```

## 启动

复制一份`map.example.json`,更改参数配置,文件放置位置随意,配置参数具体意义参考下文。


```
cd node-docx
// 配置文件的路径,支持相对,绝对路径
npm start /xxx/map.json
```

Or

```
// 在安装PM2的情况下 
// CD到项目根目录下执行下面命令,使用指定目录下的配置文件
// -- 后面是配置文件的路径
pm2 start index.js -- /xxx/map.json
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

  // markdown文档路径,支持相对,绝对路径,必选
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

## 主题

开箱自带两套皮肤`default`,`antd`,默认为`default`主题。
目录为`themes/default`与`themes/antd`,如想换其他主题请自行替换或开发。
