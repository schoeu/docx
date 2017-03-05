/**
 * @file warning.js
 * @author schoeu
 * @description 邮件报警实现
 * */

var config = require('./config');
var warnEmail = config.get('warningEmail');
var waringFlag = config.get('waringFlag');

if (waringFlag) {
    var nodemailer = require('nodemailer');

    /**
     * 发送邮件
     *
     * @param {string} content 邮件内容,支持html
     * */
    exports.sendMail = function (content) {
        if (warnEmail) {
            var transporter = nodemailer.createTransport({
                host: warnEmail.host,
                port: warnEmail.port,
                auth: {
                    user: warnEmail.user,
                    pass: warnEmail.pass
                }
            });

            var mailOptions = {
                from: warnEmail.from,
                to: warnEmail.to,
                subject: warnEmail.subject,
                text: content || ''
            };
            transporter.sendMail(mailOptions, function (error) {
                // 错误处理
            });
        }
    };
}
