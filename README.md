# docx

> markdown文件浏览工具

## 安装

```
npm install node-docx
```

## 启动

```
npm start
```

## 配置参数

```
{
  // 监听端口
  "port": "8910",

  // markdown文档路径
  "path": "/home/work/docx",

  // 需要忽略的目录名
  "ignoreDir": ["img",".git",".svn"],

  // 是否debug状态, 非debug状态会启用缓存
  "debug": true,

  // header条标题
  "headText": "PSFE-DOC",

  // web title
  "title": "PSFE",

  // 默认文档路径
  "index": "/readme.md",

  // 技术支持邮箱
  "surposEmail": "xx@xxx.com",

  // 默认false, 开启报错后会发送邮件
  "waringFlag": false,

  // 报警邮箱配置
  "warningEmail": {
    "host": "smtp.163.com",
    "port": 25,
    "user": "xx@163.com",
    "pass": "password",
    "from": "xx@163.com", // 发件人
    "to": "xx@xxx.com", // 收件人
    "subject": "DOCX error"  // 邮件标题
  },

  // 文件夹目录配置,key为对应的真实目录名,name为展示名,sort为根目录文件夹排名标志
  "dirname": {
    "dir1": {
      "name": "dir1",
      "sort": 1
    },
    "dir2": {
      "name": "dir2",
      "sort": 2
    },
    "dir3": {
      "name": "dir3"
    }
  },

  // 链接配置,展示位置为右上角,可以配置其他链接
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
  }
}

```
