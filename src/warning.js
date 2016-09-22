/**
 * @file warning.js
 * @author schoeu
 * 邮件报警实现
 * */
var nodemailer = require('nodemailer');
var CONF = require('../docx-conf.json');

var transporter = nodemailer.createTransport({
    host: CONF.warningEmail.host,
    port: CONF.warningEmail.port,
    auth: {
        user: CONF.warningEmail.user,
        pass: CONF.warningEmail.pass
    }
});

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

exports.sendMail = sendMail;