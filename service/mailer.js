var nodemailer = require('nodemailer');
var config = require('./config');

//var SERVER_URL = "https://kitchensyncip.com";
var SERVER_URL = "localhost:8080";

function send(details , callback)
{
    // Create a SMTP transporter object
    let transporter = nodemailer.createTransport({
        host:  'smtp.gmail.com',
        port: 465,
        secure: true,
        service: 'Gmail',//use ssl
        auth: {
            user: 'sky19938470',
            pass: 'koguryo1993'
        }
    });

    // Message object
    let message = {
        from: '<server@kitchensyncip.com>',
        to: '<' + details.to + '>',
        subject: 'KitchenSyncIP',
       
        html: details.html
    };

    transporter.sendMail(message, (err, info) => {
        if (err) {
            console.log('\n  Error occurred. ' + err.message);
            return callback(err , info)
        }
        callback(null , info);
    });

}
exports.verifyEmail = function(to , content ,callback)
{
    var details = {
        to: to,
        html: '<!DOCTYPE>' +
                '<html>' +
                    '<head>' +
                    '</head>' +
                    '<body>' +
                        'If you want to verify your email please visit following url.' + 
                        '<a href = "' + SERVER_URL + '/verification/verify-email/' + content + '">' + SERVER_URL + '/verification/verify-email/' + content + '</a>' +                       
                    '</body>' +
                '</html>'
    };
    send(details, function(err, result) {
        callback(err, result);
    });
};

exports.sendInviteNotificationEmail = function(to , callback)
{
    var details = {
        to: to,
        html: '<!DOCTYPE>' +
                '<html>' +
                    '<head>' +
                    '</head>' +
                    '<body>' +
                        '<h3>Congratulations!</h3>' + 
                        '<span>You received a new invite</span><br>' +
                        '<span>Please visite your Profile page and check invites.</span><br>' +
                    '</body>' +
                '</html>'
    };
    send(details, function(err, result) {
        callback(err, result);
    });
}

exports.sendForgotPasswordEmail = function(to , token , callback)
{
    var details = {
        to: to,
        html: '<!DOCTYPE>' +
                '<html>' +
                    '<head>' +
                    '</head>' +
                    '<body>' +
                        '<h3>Password Change required!</h3>' + 
                        '<span>If you want to create a new password please check this url.</span>'+ '<a href = "' + SERVER_URL + '/user-profile/password-forgot/new/' + token + '">' + SERVER_URL + '/user-profile/password-forgot/new/' + token + '</a></span>' + 
                        '<br>' +
                        '<span>If you did not ask this request please check this url</span>'+ '<a href = "' + SERVER_URL + '/user-profile/password-forgot/cancel/' + token + '">' + SERVER_URL + '/user-profile/password-forgot/cancel/' + token + '</a></span>' +
                        '<br>' +
                    '</body>' +
                '</html>'
    };
    send(details, function(err, result) {
        callback(err, result);
    });
}

exports.sendNewPassword = function(to , newpwd , callback)
{
    var details = {
        to: to,
        html: '<!DOCTYPE>' +
                '<html>' +
                    '<head>' +
                    '</head>' +
                    '<body>' +
                        '<h3>Your new password is here. We honestly recommend change this password after first log in.</h3>' + 
                        '<span>' + newpwd + '</span>' +
                    '</body>' +
                '</html>'
    };
    send(details, function(err, result) {
        callback(err, result);
    });
}


exports.sendNewUserPassword = function(to , new_pwd , license_key , callback)
{
    var details = {
        to: to,
        html: '<!DOCTYPE>' +
                '<html>' +
                    '<head>' +
                    '</head>' +
                    '<body>' +
                        '<h3>Welcome to KitchenSyncIP</h3>' + 
                        '<span>Your password is ' + new_pwd + "</span><br>" +
                        '<span>Your new license key is ' + license_key + "</span><br>" +
                    '</body>' +
                '</html>'
    };
    send(details, function(err, result) {
        callback(err, result);
    });
}
exports.customerForgotPwd = function(to , new_pwd , callback)
{
    var details = {
        to: to,
        html: '<!DOCTYPE>' +
                '<html>' +
                    '<head>' +
                    '</head>' +
                    '<body>' +
                        'If you want to change password please visit following url.' + 
                        '<a href = "https://license.kitchensyncip.com/customer/confirm-change-pwd/' + new_pwd + '">https://license.kitchensyncip.com/customer/confirm-change-pwd/' + new_pwd + '</a>' +
                        '<br>' +
                        '<br>' + 
                        'If you want to cancel please visit following url.' + 
                        '<a href = "https://license.kitchensyncip.com/customer/cancel-change-pwd/' + new_pwd + '">https://license.kitchensyncip.com/customer/cancel-change-pwd/' + new_pwd + '</a>' +
                    '</body>' +
                '</html>'
    };
    send(details, function(err, result) {
        callback(err, result);
    });
}