var nodemailer = require('nodemailer');
var CONF = require('../docx-conf.json');
if (CONF.smtps) {

}
// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
    host: CONF.warningEmail.host, // 主机
    port: CONF.warningEmail.port,
    auth: {
        user: CONF.warningEmail.user, // 账号
        pass: CONF.warningEmail.pass // 密码
    }
});

function sendMail(content) {
    // send mail with defined transport object
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: CONF.warningEmail.from, // sender address
        to: CONF.warningEmail.to,
        subject: CONF.warningEmail.subject, // Subject line
        text: content || ''
    };
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }
    });
}

exports.sendMail = sendMail;