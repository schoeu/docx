/**
 * @file warning.js
 * @author schoeu
 * 邮件报警实现
 * */
var nodemailer = require('nodemailer');
var CONF;
var transporter;

/**
 * 发送邮件
 *
 * @param {String} content 邮件内容,支持html
 * */
function sendMail(content) {
    var mailOptions = {
        from: CONF.warningEmail.from,
        to: CONF.warningEmail.to,
        subject: CONF.warningEmail.subject,
        text: content || ''
    };
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }
    });
}

exports.sendMail = function (conf) {
    CONF = conf;
    transporter = nodemailer.createTransport({
        host: CONF.warningEmail.host,
        port: CONF.warningEmail.port,
        auth: {
            user: CONF.warningEmail.user,
            pass: CONF.warningEmail.pass
        }
    });

    return sendMail;
};