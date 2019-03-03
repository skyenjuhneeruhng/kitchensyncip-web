var user = require('./user');
var database = require('./database');
var threads = require('./threads');
var entries = require('./entries');

function formatJSON(jsonobj)
{
	var returnVal = "";
	var order = 0;
	for(var i = 0 ; i < jsonobj.length ; i ++)
	{
		if(jsonobj.substr(i , 1) == "{" || jsonobj.substr(i , 1) == "[")
		{
			order ++;
			returnVal += jsonobj.substr(i , 1) + "\n";
			for(var j = 0 ; j < order ; j ++)
			{
				returnVal += "   ";
			}
		}
		else if(jsonobj.substr(i , 1) == "}" || jsonobj.substr(i , 1) == "]")
		{
			order --;
			returnVal += "\n";
			for(var j = 0 ; j < order ; j ++)
			{
				returnVal += "   ";
			}
			returnVal += jsonobj.substr(i , 1) + "\n";
			for(var j = 0 ; j < order ; j ++)
			{
				returnVal += "   ";
			}
		}
		else if(jsonobj.substr(i , 1) == ",")
		{
			returnVal += jsonobj.substr(i , 1) + "\n";
			for(var j = 0 ; j < order ; j ++)
			{
				returnVal += "   ";
			}
		}
		else
		{
			returnVal += jsonobj.substr(i , 1);
		}
	}
	return returnVal;
}


module.exports = function(app)
{
	app.get('/' , function(req , res){
		var user = req.user;
		return res.render('home' , {user : user});
	});

	//login and change password
	app.get('/login' , function(req , res){
		if(req.user)
			return res.redirect('/');
		else
			return res.render('login');
	});
	app.post('/login' , user.loginUser);
	app.get('/logout' , user.logout);
	app.get('/forgot' , function(req , res){
		if(req.user)
			return res.redirect('/');
		else
			return res.render('forgot');
	});
	app.post('/forgot' , user.forgot);

	app.get('/user-profile/password-forgot/new/:token' , user.acceptForgotPassword);
	app.get('/user-profile/password-forgot/cancel/:token' , user.cancelForgotPassword);
	app.get('/user-profile' , function(req , res){
		return res.redirect('/user-profile/me');
	});
	app.get('/user-profile/me' , function(req , res){
		if(!req.user)
			return res.redirect('/');
		else
			return res.render('profile' , {user : req.user});
	});
	app.get('/user-profile/password' , function(req , res){
		if(!req.user)
			return res.redirect('/');
		else
			return res.render('profile_password' , {user : req.user});
	});
	app.get('/user-profile/invite' , function(req , res){
		if(!req.user)
			return res.redirect('/');
		else if(req.user.companyid != -1)
			return res.redirect('/user-profile');
		else
		{
			database.getInvites(req.user.email , function(res1){
				if(res1.status == "SUCCESS")
				{
					return res.render('profile_invite' , {user : req.user , invites : res1.msg});
				}
				else
				{
					return res.redirect('/error');
				}
			});
			
		}
	});
	app.get('/user-profile/config' , function(req , res){
		if(!req.user)
		{
			return res.redirect('/');
		}
		else
		{
			database.getUserConfigs(req.user.id , function(res1){
				if(res1.status == "SUCCESS")
					return res.render('profile_config' , {user : req.user , configs : res1.msg});
				else
					return res.redirect('/error');
			});
		}
	});
	app.get('/user-profile/thread' , function(req , res){
		if(!req.user)
		{
			return res.redirect('/');
		}
		else
		{
			database.getUserThreads(req.user.id , function(res1){
				if(res1.status == "SUCCESS")
				{
					return res.render('profile_thread' , {user : req.user , threads : res1.msg});
				}
				else
				{
					return res.redirect("/error");
				}
			});
			
		}
	});

	app.post('/user-profile/me/save-changes' , user.saveChanges);
	app.post('/user-profile/me/create-company' , user.createCompany);
	app.post('/user-profile/password/change-password' , user.changePassword);
	app.post('/user-profile/invite/reject' , user.rejectInvite);
	app.post('/user-profile/invite/accept' , user.acceptInvite);
	app.post('/user-profile/thread/close' , user.closeThread);
	app.post('/user-profile/thread/makeprivate' , user.makePrivateThread);
	app.post('/user-profile/config/makePrivate' , user.makePrivateConfig);

	app.get('/forum' , function(req , res){

		//the number of threads per page 10
		//offset = 0
		//searchkey = ""
		var offset = parseInt(req.query.offset);
		var searchkey = req.query.searchkey;
		if(!offset)
			offset = 0;
		if(!searchkey)
			searchkey = "";
		var companyid = -1;
		if(req.user)
			companyid = req.user.companyid;
		var param = {
			offset : offset,
			searchkey : searchkey,
			companyid : companyid
		};

		database.getThreads(param , function(res1){
			
			var user = req.user;
			if(res1.status == "FAILED")
			{
				return res.render('forum' , {user : user , threads : [] , searchkey : searchkey , offset : (offset + 1) , counts : 0});
			}
			else
			{
				return res.render('forum' , {user : user , threads : res1.msg , searchkey : searchkey , offset : (offset + 1) , counts : res1.counts});
			}
		})

	});
	app.get('/forum/create-thread' , function(req , res){
		if(req.user)
			return res.render('createthread' , {user : req.user});
		else
			return res.redirect('/forum');
	});
	app.post('/forum/create-thread' , threads.createThread);
	app.get('/forum/show/:id' , function(req , res){
		var companyid = -1;
		if(req.user)
			companyid = req.user.companyid;
		database.getThreadOne(req.params.id , companyid , function(res1){

			if(res1.status == "SUCCESS")
			{
				return res.render("oneforum" , {user : req.user , thread : res1.msg.thread , replies : res1.msg.replies});
			}
			else
			{
				return res.redirect('/error');
			}
		});
	})
	app.post('/forum/createreply' , threads.createReply);

	app.get('/admin' , function(req , res){
		return res.redirect('/admin/company');
	});
	app.get('/admin/company' , function(req , res){
		var user = req.user;
		if(!user)
			return res.redirect('/');
		if(user.roleid != 1)
			return res.redirect('/');

		database.getCompanyInfo(user.companyid , function(res1){
			if(res1.status == "SUCCESS")
			{
				return res.render('admin' , {user : user , company : res1.msg});
			}
			else
			{
				return res.redirect('/error');
			}
		});
	});
	app.get('/admin/members' , function(req , res){
		var user = req.user;
		if(!user)
			return res.redirect('/');
		if(user.roleid != 1)
			return res.redirect('/');

		var offset = parseInt(req.query.offset);
		var searchkey = req.query.searchkey;
		if(!offset)
			offset = 0;
		if(!searchkey)
			searchkey = "";


		database.getCompanyMembers(user.companyid , user.id , offset , function(res2){
			if(res2.status == "SUCCESS")
			{
				return res.render('admin_members' , {user : user , users : res2.msg , offset : offset + 1 , counts : res2.counts});
			}
			else
			{
				return res.redirect('/error');
			}
		});	
	});
	app.get('/admin/invite' , function(req , res){
		var user = req.user;
		if(!user)
			return res.redirect('/');
		if(user.roleid != 1)
			return res.redirect('/');

		var offset = parseInt(req.query.offset);
		var searchkey = req.query.searchkey;
		if(!offset)
			offset = 0;
		if(!searchkey)
			searchkey = "";

		database.getNormalUsers(user.companyid , offset , searchkey , function(res1){
			if(res1.status == "SUCCESS")
				return res.render("admin_invite" , {user : user , users : res1.msg , offset : offset + 1, searchkey : searchkey , counts : res1.counts});
			else
				return res.redirect('/error');
		});
	});
	app.get('/admin/config' , function(req , res){
		var user = req.user;
		if(!user)
			return res.redirect('/');
		if(user.roleid != 1)
			return res.redirect('/');

		// var offset = parseInt(req.query.offset);
		// var searchkey = req.query.searchkey;
		// if(!offset)
		// 	offset = 0;
		// if(!searchkey)
		// 	searchkey = "";
		database.getCompanyConfigs(user.companyid , function(res1){
			if(res1.status == "SUCCESS")
			{
				return res.render("admin_config" , {user : user , configs : res1.msg});
			}
			else
			{
				return res.redirect('/error');
			}
		});
	});
	app.get('/admin/thread' , function(req , res){
		var user = req.user;
		if(!user)
			return res.redirect('/');
		if(user.roleid != 1)
			return res.redirect('/');

		// var offset = parseInt(req.query.offset);
		// var searchkey = req.query.searchkey;
		// if(!offset)
		// 	offset = 0;
		// if(!searchkey)
		// 	searchkey = "";

		database.getCompanyThreads(user.companyid , function(res1){
			if(res1.status == "SUCCESS")
			{
				return res.render("admin_thread" , {user : user , threads : res1.msg});
			}
			else
			{
				return res.redirect('/error');
			}
		});


	});
	app.post('/admin/company/change-company-profile' , user.changeCompanyProfile);
	app.post('/admin/Members/remove-member' , user.removeMember);
	app.post('/admin/Members/change-user-permission' , user.changeUserPermission);
	app.post('/admin/Members/invite' , user.inviteMember);

	app.get('/config' , function(req , res){
		var user = req.user;
		if(user)
		{
			var offset = parseInt(req.query.offset);
			var searchkey = req.query.searchkey;
			if(!offset)
				offset = 0;
			if(!searchkey)
				searchkey = "";
			
			var param = {
				userid : user.id,
				companyid : user.companyid,
				offset : offset,
				searchkey : searchkey
			};

			database.getConfigs(param , function(res1){
				if(res1.status == "SUCCESS")
				{
					return res.render('config' , {user : user , configs : res1.msg , offset : offset + 1, searchkey : searchkey , counts : res1.counts});
				}
				else
				{
					return res.redirect("/error");
				}
			});
			
		}
		else
		{
			return res.redirect('/');
		}
	});
	app.get('/config/show/:id' , function(req , res){
		var user = req.user;
		var configid = req.params.id;
		var param = {
			configid : configid,
			companyid : user.companyid,
			privatemember : user.privatemember
		};
		database.getConfigOne(param , function(res1){
			if(res1.status = "SUCCESS")
			{
				//formatting json for good view
				var config = res1.msg;

				config.content = formatJSON(config.content);
				
				return res.render('config_show' , {user : user , config : config});
			}
			else
			{
				return res.redirect("/error");
			}
		});
	});
	app.get('/config/edit/:id' , function(req , res){
		var user = req.user;
		var configid = req.params.id;
		var param = {
			configid : configid,
			companyid : user.companyid,
			privatemember : user.privatemember
		};
		database.getConfigOne(param , function(res1){
			
			if(res1.status == "SUCCESS")
			{
				var config = res1.msg;
				if(config.userid != user.id && user.roleid != 1)
					return res.redirect("/error");		
				try{
					var configContent = JSON.parse(config.content);
					return res.render('editconfig' , {user : user , config : config , configObj : configContent});
				}
				catch(err)
				{
					return res.render('editconfig' , {user : user , config : config , configObj : {arcapp_conf : {},entries_conf : {}}});
				}
				
			}
			else
			{
				return res.redirect("/error");
			}
		});
	});
	app.get('/config/create-config' , function(req , res){
		var user = req.user;
		if(user)
			return res.render('createconfig' , {user : user});
		else
			return res.redirect('/');
	});
	app.post('/config/create-config/save' , entries.createNewConfig);
	app.post('/config/edit-config/update' , entries.updateConfig);
	app.post('/config/like' , user.like);
	app.post('/config/unlike' , user.unlike);
	app.get('/config/download' , user.downloadConfig);


	//signup and verification
	app.get('/signup' , function(req , res){
		if(req.user)
			return res.redirect("/");
		else
			return res.render('signup');
	});
	app.post('/signup' , user.registerUser);
	app.get('/verification/verify-email/:uuid' , user.verifyEmail);
	app.get('/verification/success' , function(req , res){
		res.render('verification-success');
	});



	app.get('/error' , function(req , res){
		// res.writeHead(500)
		// res.write("Internal server error");
		// res.end();
		res.render("error");
	})
	app.get('*', function(req, res) 
    {
        res.writeHead(404);
        res.write("Page not found!");
        res.end();
	});
}