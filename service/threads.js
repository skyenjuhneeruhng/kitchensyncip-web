var database = require('./database');

exports.createThread = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.status == 0)
			return res.json({status : "FAILED" , msg : "You should verify your email first"});
		var	param = {
			privatemember : req.user.privatemember,
			userid : req.user.id,
			title : req.body.title,
			content : req.body.content,
			keywords : req.body.keywords,
			isprivate : req.body.isprivate,
			companyid : req.user.companyid
		};
		database.createThread(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}

exports.createReply = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.status == 0)
			return res.json({status : "FAILED" , msg : "You should verify your email first"});
		var param = {
			threadid : req.body.threadid,
			content : req.body.content,
			userid : req.user.id,
			username : req.user.username,
			companyid : req.user.companyid,
			roleid : req.user.roleid,
			privatemember : req.user.privatemember,
			photo : req.user.photo
		};
		database.createReply(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}