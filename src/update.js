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
        res.end('ok');
    });
}

module.exports = update;