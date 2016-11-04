/**
 * @file setup.js
 * @description 设置页面主文件
 * @author schoeu
 * */

module.exports = function (req, res) {
    var method = req.method;
    if (method === 'GET') {
        res.render('setup');
    }
};
