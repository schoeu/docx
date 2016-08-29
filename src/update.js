/**
 * @file update.js
 * @author schoeu
 * 文件更新钩子
 * */
var child_process = require('child_process');
var CONF = require('../docx-conf.json');

function update(req, res) {
    // 更新代码
    child_process.exec('git pull', {
        cwd: CONF.path
    }, function (err, result) {
        if (err) {
            console.error(err);
        }

        // 如果有更新package.json文件则重启node进程
        if (result.toString().indexOf('package.json') > -1) {
            // 重启node进程
            child_process.exec('pm2 restart docx', {
                cwd: CONF.path
            }, function () {
                res.end('ok');
            });
        }
        else {
            res.end('ok');
        }
    });
}

module.exports = update;