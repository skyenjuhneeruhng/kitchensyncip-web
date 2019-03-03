var fs = require('fs');
var express = require('express');
var http = require('http');
var https = require('https');
var ip = require('ip');
var session = require('express-session');
const fileUpload = require('express-fileupload');
const app = express();
var bodyParser = require('body-parser');
var path = require('path');
var cookieParser = require('cookie-parser');
var config = require('./config');
var database = require('./database');
var routes = require('./routes');
var lib = require('./lib');

app.set('views' , path.join(__dirname , '../views'));

app.locals.pretty = true;

app.engine('html' , require('dot-emc').init(
	{
        app: app,
        fileExtension:"html",
        options: {
            templateSettings: {
                cache: false
            }
        }
    }
).__express);

app.use(bodyParser());
app.use(cookieParser());
app.use(fileUpload());
app.set("view engine", "html");
app.disable('x-powered-by');
app.enable('trust proxy');

app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

var twoWeeksInSeconds = 1209600;
app.use(express.static(path.join(__dirname, '../views'), { maxAge: 1 })); 
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')), { maxAge: twoWeeksInSeconds * 1000 });

// app.use(function(req , res , next){
//     if(req.secure == false)
//     {
//         return res.redirect('https://' + req.host + req.url);
//     }
//     next();
// });

app.use(function(req, res, next){

    console.log('GOT REQUEST', req.path, req.method , 'FROM' , req.ip , 'AT' , new Date());console.log('GOT REQUEST', req.path, req.method , 'FROM' , req.ip , 'AT' , new Date());

	var sessionId = req.cookies.id;
    // console.log(sessionId);
	if(!sessionId){
        res.header('Vary', 'Accept, Accept-Encoding, Cookie');
        res.header('Cache-Control', 'public, max-age=60'); // Cache the logged-out version
    
        return next();
	}

    res.header('Cache-Control', 'no-cache');
    res.header("Content-Security-Policy", "frame-ancestors 'none'");

    database.getUserBySessionId(sessionId , function(res1){
    	
        if(res1.status == "SUCCESS")
    	{
            req.user = res1.msg.user;
            // console.log(req.user);
        	return next();
        }
        else
        {
            res.clearCookie('id');
            if(res1.msg == "NOT_VALID_SESSION")
            {
                return res.redirect('/');
            }
            else
            {
                // console.log("Can not get session info - " + res1.msg);
                return res.redirect('/error');
            }
        }
    });
});

function errorHandler(err, req, res, next) {

    if (err) {
        if(typeof err === 'string') {
            return res.redirect('/error');
        } else {
            if (err.stack) {
                console.error('[INTERNAL_ERROR] ', err.stack);
            } else console.error('[INTERNAL_ERROR', err);
            res.redirect('/error');
        }

    } else {
        console.warning("A 'next()' call was made without arguments, if this an error or a msg to the client?");
    }

}

routes(app);
app.use(errorHandler);

// http server is used only when ssl registration
var serverHttp = http.createServer(app);
serverHttp.listen(config.HTTP_PORT_NUM , function(){

	console.log("HTTP SERVER IS LISTENING ON PORT:" , config.HTTP_PORT_NUM);
});

// var serverHttps;
// var options = {
// 	key : fs.readFileSync(config.HTTPS_KEY),
// 	cert : fs.readFileSync(config.HTTPS_CERT)
// };

// serverHttps = https.createServer(options , app);
// serverHttps.listen(config.HTTPS_PORT_NUM , function(){

//     database.getUserCount(function(res){
//         if(res.status == "FAILED")
//         {
//             console.log(res.msg);
//         }
//         else
//         {
//             if(res.msg == 0)
//             {
//                 database.createDefaultUser(function(res1){
//                     if(res1.status == "FAILED")
//                     {
//                         console.log(res1.msg);
//                     }
//                     else
//                     {
//                         console.log("DEFAULT USER CREATED.");
//                     }
//                 });
//             }
//         }
//     });
// 	console.log("HTTPS SERVER IS LISTENING ON PORT:" , config.HTTPS_PORT_NUM);
// });
