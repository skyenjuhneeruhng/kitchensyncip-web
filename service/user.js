var database = require('./database');
var mailer = require('./mailer');
var fs = require('fs');
var lib = require('./lib');
var uuid = require('uuid');
var path = require('path');
var mime = require('mime');
exports.registerUser = function(req , res , next)
{
	if(req.user)
		return {status : "FAILED" , msg : "Please log out before register"};
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var shouldenc = req.body.shouldenc;
	if(!username || !email || !password)
		return res.json({status : "FAILED" , msg : "Too few inputs"});

	var param = {
		username : username,
		email : email,
		password : password,
		shouldenc : shouldenc
	};
	database.registerUser(param , function(res1){
		//send verification email
		if(res1.status == "SUCCESS")
		{
			//res1.msg contains sessionParam and uuid for verification
			var sessionOptions = {
			    httpOnly: false,
			    expires : res1.msg.sessionParam.expire_at,
			    secure : false
			};
			res.cookie('id' , res1.msg.sessionParam.sessionid , sessionOptions);

			mailer.verifyEmail(email , res1.msg.uuid , function(err2 , res2){
				if(err2)
				{
					return res.json({status : "FAILED" , msg : "Can not send email"});
				}
				else
				{
					return res.json({status : "SUCCESS" , msg : ""});
				}
			});
		}
		else
		{
			return res.json(res1);
		}
	});
}
exports.verifyEmail = function(req , res , next)
{
	var uuid = req.params.uuid;
	if(!uuid)
		return res.redirect("/error");
	database.verifyEmail(uuid , function(res1){
		if(res1.status == "SUCCESS")
		{
			return res.redirect("/verification/success");
		}
		else
		{
			return res.redirect("/error");
		}
	});
}

exports.loginUser = function(req ,res ,next)
{
	if(req.user)
		return {status : "FAILED" , msg : "Please log out before log in"};
	var username = req.body.username;
	var password = req.body.password;
	var shouldenc = req.body.shouldenc;
	var rememberme = req.body.rememberme;
	if(!username || !password || !rememberme)
		return res.json({status : "FAILED" , msg : "Too few inputs"});
	var param = {
		username : username,
		password : password,
		shouldenc : shouldenc,
		rememberme : rememberme
	}
	database.getVerify(param , function(res1){
		if(res1.status == "FAILED")
		{
			return res.json(res1);
		}	
		else
		{
		    var sessionOptions = {
			    httpOnly: false,
			    expires : res1.msg.expire_at,
			    secure : false
			};
			res.cookie('id' , res1.msg.sessionid , sessionOptions);
			return res.json({status : "SUCCESS" , msg : ""});
		}
	});

}
exports.logout = function(req , res , next)
{
	// var session = req.cookies.id;
	if(req.user)
	{
		database.expireSession(req.user.id , function(res1){
			res.clearCookie('id');
		 	return res.redirect('/login');
		});
	}
	else
	{
		return res.redirect('/login');
	}
}

exports.forgot = function(req , res , next)
{
	if(req.user)
	{
		return res.json("You are already logged in");
	}
	else
	{
		//resetpasswordtoken and tempresetpassword should be created.
		database.forgot(req.body.email , function(res1){
			if(res1.status == "SUCCESS")
			{
				//resetpasswordtoken will be sent via email
				var token = res1.msg;
				mailer.sendForgotPasswordEmail(req.body.email , token , function(err2 , res2){
					if(err2)
					{
						return res.json({status : "FAILED" , msg : "Email not sent, please try again"});
					}
					else
					{
						return res.json({status : "SUCCESS" , msg : ""});
					}
				});
			}
			else
			{
				return res.json(res1);
			}
		});
	}
}

exports.acceptForgotPassword = function(req , res , next)
{	
	var token = req.params.token;
	
	database.acceptForgotPassword(token , function(res1){
		if(res1.status == "SUCCESS")
		{

			mailer.sendNewPassword(res1.msg.email , res1.msg.password , function(err2 , res2){
				if(err2)
				{
					return res.redirect('/error');
				}
				else
				{
					return res.render('accept_forgot');
				}
			});
		}
		else
		{
			return res.redirect('/error');
		}
	});
}

exports.cancelForgotPassword = function(req , res , next)
{
	var token = req.params.token;
	database.cancelForgotPassword(token , function(res1){
		if(res1.status == "SUCCESS")
		{
			return res.render('cancel_forgot');
		}
		else
		{
			return res.redirect('/error');
		}
	});
}

exports.createCompany = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.companyid == -1)//if user is already a member of another company can not create company
		{
			if(req.user.status != 0)//if user email is not verified can not create company
			{
				var param = {
					userid : req.user.id,
					companyname : req.body.companyname,
					companydesc : req.body.companydesc
				};
				database.createCompany(param , function(res1){
					return res.json(res1);
				});
			}
			else
			{ 
				return res.json({status : "FAILED" , msg : "You should verify your email before create company"});
			}
		}	
		else
		{
			return res.json({stauts : "FAIELD" , msg : "You can not create company"});
		}
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.saveChanges = function(req, res, next)
{
	if(req.user)
	{
		if(req.user.status != 0)
		{
			let userPhotoFile = req.files.photo;
			var photoPath = "";
			if(userPhotoFile)
			{
				// console.log(userPhotoFile.mimetype);
				if(userPhotoFile.mimetype == "image/png" || userPhotoFile.mimetype == "image/jpeg")
				{	
				 	var str = userPhotoFile.name;
				    str = str.replace(" " , "-");
				    var newFileName = uuid.v4() + str;
					var uploadPath = path.join(__dirname, '../views/img/uploads/' + newFileName);
					var savePath = "/img/uploads/" + newFileName;
					var photoPath = savePath;
					userPhotoFile.mv(uploadPath, function(err){
				       if(err)
				        {    
				            return res.json({status : "FAILED" , msg : "Can not upload photo"});
				        }
				        else
				        {
				            var param = {
				            	userid : req.user.id,
								photo : photoPath,
								email : req.body.email,
								username : req.body.username,
								phone : req.body.phone,
								// aboutme : req.body.aboutme
							};
							database.saveChanges(param , function(res2){
								return res.json(res2);
							});
				        }
				    });
				}
				else
				{
					return res.json({status : "FAILED" , msg : "JPEG and PNG files are allowed."});
				}
			}			
			var param = {
				userid : req.user.id,
				photo : photoPath,
				email : req.body.email,
				username : req.body.username,
				phone : req.body.phone,
				// aboutme : req.body.aboutme,
			};
			// console.log(req.body.aboutme);
			database.saveChanges(param , function(res2){
				return res.json(res2);
			});
		}
		else
		{
			return res.json({status : "FAILED" , msg : "You should verify your email before change your profile"});
		}
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}



exports.changePassword = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.usedmanuallogin != req.body.shouldenc)
			return res.json({status : "FAILED" , msg : "Wrong password"});
		var param = {
			oldpassword : req.body.oldpassword,
			encryptedPwd : req.user.password,
			newpassword : req.body.newpassword,
			userid : req.user.id,
			shouldenc : req.body.shouldenc
		};
		database.changePwd(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}

exports.changeCompanyProfile = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.companyid == -1 || req.user.roleid != 1)
			return res.json({status : "FAILED" , msg : "You have no permission to change company profile"});
		var param = {
			companyname : req.body.companyname,
			companydesc : req.body.companydesc,
			companyid : req.user.companyid
		};
		database.changeCompanyProfile(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}

exports.removeMember = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.roleid == 1)
		{
			var param = {
				userid : req.body.userid,
				companyid : req.user.companyid
			};
			database.removeMember(param , function(res1){
				return res.json(res1);
			});
		}
		else
		{
			return res.json({status : "FAILED" , msg : "You have no permission to remove user"});
		}
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.changeUserPermission = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.roleid == 1)
		{
			var param = {
				userid : req.body.userid,
				companyid : req.user.companyid,
				privatemember : req.body.privatemember
			};
			database.changeUserPermission(param , function(res1){
				return res.json(res1);
			});
		}
		else
		{
			return res.json({status : "FAILED" , msg : "You have no permission to change permission"});
		}
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.inviteMember = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.roleid == 1)
		{

			var param = {
				useremail : req.body.useremail,
				companyid : req.user.companyid
			};

			database.inviteMember(param , function(res1){
				if(res1.status == "SUCCESS")
				{
					//should send notification email
					mailer.sendInviteNotificationEmail(req.body.useremail , function(err2 , res2){
						if(err2)
						{
							return res.json({status : "FAILED" , msg : "Can not send notification email"});
						}
						else
						{
							return res.json({status : "SUCCESS" , msg : ""});
						}
					});
				}
				else
				{
					return res.json(res1);
				}
			});
		}
		else
		{
			return res.json({status : "FAILED" , msg : "You have no permission to change permission"});
		}
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}

exports.rejectInvite = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.companyid == -1)//if user is already a member of another company
		{
			if(req.user.status != 0)//if user email is not verified
			{
				var param = {
					useremail : req.user.email,
					inviteid : req.body.inviteid
				};
				database.rejectInvite(param , function(res1){
					return res.json(res1);
				});
			}
			else
			{ 
				return res.json({status : "FAILED" , msg : "You should verify your email before create company"});
			}
		}	
		else
		{
			return res.json({stauts : "FAIELD" , msg : "You can not reject invite"});
		}
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.acceptInvite = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.companyid == -1)//if user is already a member of another company
		{
			if(req.user.status != 0)//if user email is not verified
			{
				var param = {
					userid : req.user.id,
					useremail : req.user.email,
					inviteid : req.body.inviteid
				};
				database.acceptInvite(param , function(res1){
					return res.json(res1);
				});
			}
			else
			{ 
				return res.json({status : "FAILED" , msg : "You should verify your email before create company"});
			}
		}	
		else
		{
			return res.json({stauts : "FAIELD" , msg : "You can not accept invite"});
		}
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.closeThread = function(req , res , next)
{
	if(req.user)
	{
		var roleid = req.user.roleid;
		var threadid = req.body.threadid;
		var privatemember = req.user.privatemember;
		var companyid = req.user.companyid;
		var param = {
			companyid : companyid,
			roleid : roleid,
			userid : req.user.id,
			threadid : threadid,
			privatemember : privatemember
		};
		database.closeThread(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.makePrivateThread = function(req , res , next)
{
	if(req.user)
	{
		var threadid = req.body.threadid;
		var isprivate = req.body.isprivate;
		var privatemember = req.user.privatemember;
		var companyid = req.user.companyid;
		var userid = req.user.id;
		var roleid = req.user.roleid;
		var param = {
			roleid : roleid,
			userid : userid,
			companyid : companyid,
			threadid : threadid,
			isprivate : isprivate,
			privatemember : privatemember
		};
		database.makePrivateThread(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.makePrivateConfig = function(req , res , next)
{
	if(req.user)
	{
		var configid = req.body.configid;
		var isorgconfig = req.body.isorgconfig;
		var privatemember = req.user.privatemember;
		var companyid = req.user.companyid;
		var userid = req.user.id;
		var roleid = req.user.roleid;
		var param = {
			roleid : roleid,
			userid : userid,
			companyid : companyid,
			configid : configid,
			isorgconfig : isorgconfig,
			privatemember : privatemember
		};
		database.makePrivateConfig(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.like = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.status == 0)
			return res.json({status : "FAILED" , msg : "You should verify your email first"});
		var param = {
			userid : req.user.id,
			privatemember : req.user.privatemember,
			companyid : req.user.companyid,
			configid : req.body.configid
		}
		database.likeconfig(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.unlike = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.status == 0)
			return res.json({status : "FAILED" , msg : "You should verify your email first"});
		var param = {
			userid : req.user.id,
			privatemember : req.user.privatemember,
			companyid : req.user.companyid,
			configid : req.body.configid
		}
		database.unlikeconfig(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.downloadConfig = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.status == 0)
			return res.json({status : "FAILED" , msg : "You should verify your email first"});
		var param = {
			privatemember : req.user.privatemember,
			companyid : req.user.companyid,
			configid : req.query.configid
		};
		database.getConfigOne(param , function(res1){
			if(res1.status == "SUCCESS")
			{
				//only use res1.msg.fileurl
		        var file = res1.msg.fileurl;

		        var mimetype = mime.lookup(file);

		        res.setHeader('Content-disposition', 'attachment; filename='+res1.msg.fileurl);
		        res.setHeader('Content-type', mimetype);

		        var filestream = fs.createReadStream(file);

		        console.log(new Date());
		        console.log('start download');
		        filestream.pipe(res);
			}
			else
			{
				return res.json(res1);
			}
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}

