var database = require('./database');

exports.createNewConfig = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.status == 0)
			return res.json({status : "FAILED" , msg : "You should verify your email first"});
		var param = {
			content : req.body.config,
			title : req.body.title,
			userid : req.user.id,
			companyid : req.user.companyid
		};
		database.createNewConfig(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}
exports.updateConfig = function(req , res , next)
{
	if(req.user)
	{
		if(req.user.status == 0)
			return res.json({status : "FAILED" , msg : "You should verify your email first"});
		var param = {
			content : req.body.config,
			title : req.body.title,
			userid : req.user.id,
			companyid : req.user.companyid,
			configid : req.body.configid,
			roleid : req.user.roleid,
		};
		database.updateConfig(param , function(res1){
			return res.json(res1);
		});
	}
	else
	{
		return res.json({status : "FAILED" , msg : "Log in first"});
	}
}