/**
 * @file warning.js
 * @author schoeu
 * 邮件报警实现
 * */

var config = require('../config');
var warnEmail = config.get('warningEmail');
var waringFlag = config.get('waringFlag');

if (waringFlag) {
    var nodemailer = require('nodemailer');
    /**
     * 发送邮件
     *
     * @param {String} content 邮件内容,支持html
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
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log(error);
                }
            });
        }
    };
}
