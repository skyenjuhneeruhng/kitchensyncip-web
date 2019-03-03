var pg = require('pg');
var config = require('./config');
var lib = require('./lib');
var passwordHash = require('password-hash');
var uuid = require('uuid');
var mailer = require('./mailer');
var fs = require('fs');
var path = require('path');

var databaseUrl = config.DATABASE_URL;

pg.types.setTypeParser(20, function(val)
{ 
	// parse int8 as an integer
    return val === null ? null : parseInt(val);
});

// function to connect with DB.
function connect(callback)
{
    return pg.connect(databaseUrl, callback);
}

// function to use sql.
function query(query, params, callback)
{
    //thrid parameter is optional
    if (typeof params == 'function')
    {
        callback = params;
        params   = [];
    }

    connect(function(err, client, done) 
    {
        if (err) return callback(err);
        client.query(query, params, function(err, result) 
        {
            done();
            if (err) 
            {
                return callback(err);
            }
            callback(null, result);
        });
    });
}


exports.query = query;

exports.registerUser = function(param , callback)
{
	var username = param.username;
	var email = param.email;
	var password = param.password;
	if(!username || !email || !password)
		return {status : "FAILED" , msg : "Too few inputs"};
	var shouldenc = parseInt(param.shouldenc);//this check social login and manual login
	if(shouldenc > 0)
		shouldenc = 1;
	else
		shouldenc = 0;
	var created_at = new Date();
	var updated_at = new Date();
	//companyid = -1

	query("select count(id) as counts from users where username = $1 or email = $2" , [username , email] , function(err2 , res2){
		if(err2)
		{
			return callback({status : "FAILED" , msg : "Can not get users table info : " + err2.message});
		}
		else
		{
			if(res2.rows[0].counts > 0)
			{
				return callback({status : "FAILED" , msg : "Email or username has already taken."});
			}
			else
			{
				query("select max(id) as maxid from users" , [] , function(err1 , res1){
					if(err1)
					{
						return callback({status : "FAILED" , msg : "Can not get max id :" + err1.message});
					}
					else
					{	
						var maxid = res1.rows[0].maxid + 1;
						
				
						
						var encryptedPwd = passwordHash.generate(password);
						
						var verifyuuid = uuid.v4();
						//insert as observer
						query("insert into users (id , username , email , password , companyid , created_at , updated_at , roleid , status , verificationuuid , usedmanuallogin , privatemember) values ($1 , $2 , $3  , $4 , -1 , $5 , $6 , 3 , 0 , $7 , $8 , 0)" , [maxid , username , email , encryptedPwd , created_at , updated_at , verifyuuid , shouldenc] , function(err , res){
							if(err)
							{
								return callback({status : "FAILED" , msg : "Can't register user : " + err.message});
							}
							else
							{
								
								var expire_at = new Date();
								var created_at = new Date();
								expire_at.setDate(expire_at.getDate() + 1);
								var session_id = uuid.v4();
								var sessionParam = {
									sessionid : session_id,
									userid : maxid,
									expire_at : expire_at,
									created_at : created_at
								};

								insertSession(sessionParam , function(res3){
									if(res3.status == "FAILED")
									{
										return callback(res3);
									}
									else
									{
										return callback({status : "SUCCESS" , msg : {sessionParam : sessionParam , uuid : verifyuuid}});
									}
								});
							}
						});
					}
					
				});
			}
		}
	});


}

exports.verifyEmail = function(uuid , callback)
{
	query("select * from users where verificationuuid = $1 and status = 0" , [uuid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get users table info"});
		}
		else
		{
			if(res.rows.length == 0)
			{
				return callback({status : "FAILED" , msg : "Wrong uuid"});
			}
			else
			{
				query("update users set status = 1 , verificationuuid = '' where verificationuuid = $1" , [uuid] , function(err1 , res1){
					if(err1)
					{
						return callback({status : "FAILED" , msg : "Can not update users table"});
					}
					else
					{
						return callback({status : "SUCCESS" , msg : ""});
					}
				});
			}
		}
	})
}

exports.getVerify = function(param , callback)
{
	var username = param.username;
	var password = param.password;
	var shouldenc = param.shouldenc;
	var rememberme = param.rememberme;
	if(!username || !password || !rememberme)
		return res.json({status : "FAILED" , msg : "Too few inputs"});
	//select user with credentials
	query("select * from users where username = $1 or email = $1" , [username] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get user info : " + err.message});
		}
		else
		{
			if(res.rows.length == 0)
				return callback({status : "FAILED" , msg : "There is no user"});
			var user = res.rows[0];
			var userStatus = user.status;
			if(userStatus == 2)
			{
				return callback({status : "FAILED" , msg : "Deleted user"});
			}
			else
			{
				var verified = false;
				// console.log(shouldenc);
				if(shouldenc == 1)
				{
					verified = passwordHash.verify(password , user.password); 
				}
				else
				{
					verified = ((password == user.password)?true:false);
				}

				if(!verified)
					return callback({status : "FAILED" , msg : "Wrong password"});

				var expire_at = new Date();
				var created_at = new Date();
				if(rememberme == 1)
					expire_at.setDate(expire_at.getDate() + 10*365);
				else
					expire_at.setDate(expire_at.getDate() + 1);
				var session_id = uuid.v4();
				var sessionParam = {
					sessionid : session_id,
					userid : user.id,
					expire_at : expire_at,
					created_at : created_at
				};

				insertSession(sessionParam , function(res1){
					return callback(res1);
				});
			}
		}
	});
}

function insertSession(param , callback)
{
	query('insert into sessions (id , userid , expire_at , created_at) values ($1 , $2 , $3 , $4)' , [param.sessionid , param.userid , param.expire_at , param.created_at] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not insert into sessions table - " + err.message});
		}
		else
		{
			return callback({status : "SUCCESS" , msg : param});
		}
	});
}

exports.getUserBySessionId = function(session_id , callback)
{
	var nowTime = new Date();
	query('select t1.* from (select users.* , companies.name as companyname from users left join companies on users.companyid = companies.id) as t1 left join sessions on t1.id = sessions.userid where sessions.id = $1 and sessions.expire_at > $2' , [session_id , nowTime] , function(err, res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get session info - " + err.message});
		}
		else
		{
			var data = res.rows;
			if(data.length == 0)
				return callback({status : "FAILED" , msg : "NOT_VALID_SESSION"});

			var user = data[0];
			return callback({status : "SUCCESS" , msg : {user : user}});
		}

	});
}

exports.expireSession = function(userid , callback)
{
	var nowTime = new Date();
	query('update sessions set expire_at = $1 where userid = $2 and expire_at > $1' , [nowTime , userid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not expire - " + err.message});
		}
		else
		{
			return callback({status : "SUCCESS" , msg : "SESSION_EXPIRED"});
		}
	});	

}

exports.createThread = function(param , callback)
{
	var userid = param.userid;
	var	title = param.title;
	var	content = param.content;
	var	keywords = param.keywords;
	var	isprivate = param.isprivate;
	var	companyid = param.companyid;	
	var privatemember = param.privatemember;
	
	if(!title || !content)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	if(lib.checkOffensive(title) || lib.checkOffensive(content) || lib.checkOffensive(keywords))
		return callback({status : "FAILED" , msg : "Offensive words!"});
	query("select max(id) as maxid from threads" , [] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get max id from threads table"});
		}
		else
		{
			var maxid = res.rows[0].maxid + 1;
			var created_at = new Date();
			var updated_at = new Date();
			
			if(privatemember == 0 || companyid == -1)
				return callback({status : "FAILED" , msg : "Can not create private thread"});
			//users may create threads before they become a member of company
			//and also they can make it private or not after a member of company
			//so public thread has not companyid
			if(isprivate == 0)
				companyid = -1;
			
			query("insert into threads (id , title , content , keywords , created_at , updated_at , userid , status , isprivate , companyid , lastupdater) values($1 , $2 , $3 , $4 , $5 , $6 , $7 , 0 , $8 , $9 , $10)" ,
			 [maxid , title , content , keywords , created_at , updated_at , userid , isprivate , companyid , userid] , function(err1 , res1){
			 	if(err1)
			 	{
			 		return callback({status : "FAILED" , msg : "Can not insert into threads table"});
			 	}	
			 	else
			 	{
			 		return callback({status : "SUCCESS" , msg : ""});
			 	}
			});
		}
	});

}

exports.getThreads = function(param , callback)
{
	var offset = param.offset * 10;
	var searchkey = param.searchkey;
	var companyid = param.companyid;
	query("select count(id) as counts from threads  where (keywords like '%" + searchkey + "%' or title like '%" + searchkey + "%' or content like '%" + searchkey + "%') and (isprivate = 0 or companyid = $1)" , [companyid] , function(err1 , res1){
		if(err1)
		{
			callback({status : "FAILED" , msg : "Can not get threads count"});
		}
		else
		{
			var counts = res1.rows[0].counts;
			if(counts > 0)
			{
				query("select threads.* , users.username as username , users.photo as photo from threads left join users on users.id = threads.lastupdater where (threads.keywords like '%" + searchkey + "%' or threads.title like '%" + searchkey + "%' or threads.content like '%" + searchkey + "%') and (threads.isprivate = 0 or threads.companyid = $1) offset $2 limit 10" , [companyid , offset] , function(err , res){
					if(err)
					{
						return callback({status : "FAILED" , msg : "Can not get threads from table"});
					}
					else
					{	
						for(var i = 0 ; i < res.rows.length ; i ++)
						{
							var threadOne = res.rows[i];
							var keywords = threadOne.keywords.split(",");
							res.rows[i].keywords = keywords;
						}
						return callback({status : "SUCCESS" , msg : res.rows , counts : counts});
					}
				});
			}
			else
			{
				return callback({status : "SUCCESS" , msg : [] , counts : 0});
			}
		}
	});
	
}

exports.getThreadOne = function(threadid , usercompanyid , callback)
{

	//get one thread
	query("select threads.* , users.username , users.photo from threads left join users on users.id = threads.userid where threads.id = $1" , [threadid] , function(err , res){
		if(err)
		{
			console.log(1);
			return callback({status : "FAILED" , msg : "Can not get thread info"});
		}
		else
		{
			if(res.rows.length != 1)
			{
				console.log(2);
				return callback({status : "FAILED" , msg : "Wrong thread id"});
			}
			var threadOne = res.rows[0];
			var keywords = threadOne.keywords.split(",");
			threadOne.keywords = keywords;
			//get replies
			query("select replies.* , users.username , users.photo from replies left join users on replies.userid = users.id where replies.threadid = $1" , [threadid] , function(err1 , res1){
				if(err1)
				{
					console.log(3);
					return callback({status : "FAILED" , msg : "Can not get replies info"});
				}
				else
				{	
					var replies = res1.rows;
					return callback({status : "SUCCESS" , msg : {thread : threadOne , replies : replies}});
				}
			});
		}
	});
}

exports.createReply = function(param , callback)
{
	var threadid = param.threadid;
	var userid = param.userid;
	var username = param.username;
	var content = param.content;
	var companyid = param.companyid;
	var roleid = param.roleid;
	var privatemember = param.privatemember;
	var photo = param.photo;
	if(!content || !threadid || !userid || !username)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	if(lib.checkOffensive(content))
		return callback({status : "FAILED" , msg : "Offensive words!"});
	//check if threadid is valid
	query('select * from threads where id = $1 and status = 0' , [threadid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get threads info"});
		}
		else
		{
			var counts = res.rows.length;
			if(counts != 1)
				return callback({status : "FAILED" , msg : "Wrong thread id"});
			var threadOne = res.rows[0];
			if(threadOne.isprivate == 1 && (roleid == 3 || companyid != threadOne.companyid || (roleid == 2 && privatemember == 0)))
				return callback({status : "FAILED" , msg : "You have no permission to reply on private thread"});
			var updated_at = new Date();
			query('update threads set updated_at = $1 , lastupdater = $3 where id = $2' , [updated_at , threadid , userid] , function(err1 , res1){
				if(err1)
				{	
					return callback({status : "FAILED" , msg : "Can not update threads table"});
				}
				else
				{
					query("select max(id) as maxid from replies" , [] , function(err2 , res2){
						if(err2)
						{
							return callback({status : "FAILED" , msg : "Can not get max id from replies"});
						}
						else
						{
							var maxid = res2.rows[0].maxid + 1;

							query("insert into replies (id , userid , threadid , content , created_at) values($1 , $2 , $3 , $4 , $5)" ,
							 [maxid , userid , threadid , content , updated_at] , function(err3 , res3){
							 	if(err3)
							 	{
							 		return callback({status : "FAILED" , msg : "Can not insert into replies"});
							 	}
							 	else
							 	{

							 		return callback({status : "SUCCESS" , msg : {username : username , content : content , created_at : updated_at , photo : photo}});
							 	}
							 });
						}
					})
				}
			});
		}
	});
}

exports.createCompany = function(param , callback)
{
	var userid = param.userid;
	var companyname = param.companyname;
	var companydesc = param.companydesc;
	if(!userid || !companyname || !companydesc)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query("select max(id) as maxid from companies" , [] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get max id of companies table"});
		}
		else
		{
			//insert into companies table
			var maxid = res.rows[0].maxid + 1;
			var created_at = new Date();
			query("insert into companies (id , userid , created_at , name , description) values ($1 , $2 , $3 , $4 , $5)" , [maxid , userid , created_at , companyname , companydesc] , function(err1 , res1){
				if(err1)
				{
					return callback({status : "FAILED" , msg : "Can not insert into companies table"});
				}
				else
				{
					//update user roleid and privatemember
					var updated_at = new Date();
					query("update users set privatemember = 1 , roleid = 1 , companyid = $2 , updated_at = $3 where users.id = $1" , [userid , maxid , updated_at] , function(err2 , res2){
						if(err2)
						{
							return callback({status : "FAILED" , msg : "Can not update user role"});
						}
						else
						{
							//should change threads company info
							var updated_at = new Date();
							query("update threads set companyid = $1 , isprivate = 0 , updated_at = $3 where userid = $2" , [maxid , userid , updated_at] , function(err3 , res3){
								if(err3)
								{
									return callback({status : "FAILED" , msg : "Can not update threads"});
								}
								else
								{
									query("update configs set companyid = $1 , isorgconfig = 0 , updated_at = $3 where userid = $2" , [maxid , userid , updated_at] , function(err3 , res3){
										if(err3)
										{
											return callback({status : "FAILED" , msg : "Can not update threads"});
										}
										else
										{
											return callback({status : "SUCCESS" , msg : ""});
										}
									});
								}
							});
							
						}
					})
				}
			});
		}
	});
}

exports.saveChanges = function(param , callback)
{
	var userid = param.userid;
	var photo = param.photo;
	var email = param.email;
	var username = param.username;
	var phone = param.phone;
	// var aboutme = param.aboutme;
	var updated_at = new Date();
	if(!email || !username || !userid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	//check there is already someone who uses the same email and username
	query('select id from users where username = $1 or email = $2' , [username , email] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not read users table"});
		}
		else
		{
			//no one or this is you
			if(res.rows.length == 0 || (res.rows.length > 0 && res.rows[0].id == userid))
			{
				var sqlWithPhoto = "update users set photo = '" + photo + "' , email = $1 , username = $2 , phone = $3 , updated_at = $4 where id = $5";
				var sqlWithoutPhoto = "update users set email = $1 , username = $2 , phone = $3 , updated_at = $4 where id = $5";
				query((((photo)?(sqlWithPhoto):(sqlWithoutPhoto))) , [email , username , phone , updated_at , userid] , function(err1 , res1){
					if(err1)
					{
						return callback({status : "FAILED" , msg : "Can not update users table"});
					}
					else
					{	
						return callback({status : "SUCCESS" , msg : ""});
					}
				});
			}
			else//yes
			{
				return callback({status : "FAILED" , msg : "Username or email has been already taken"});
			}

		}
	});

}

exports.changePwd = function(param , callback)
{
	var oldpassword = param.oldpassword;
	var encryptedPwd = param.encryptedPwd;
	var newpassword = param.newpassword;
	var shouldenc = param.shouldenc;
	var userid = param.userid;
	if(!newpassword || !userid)
		return callback({status : "FAILED" , msg : "Too few inputs"});

	//password checking...
	shouldenc = parseInt(shouldenc);
	if(shouldenc > 0)
		shouldenc = 1;
	else	
		shouldenc = 0;
	if(shouldenc == 1)//used manual login
	{
		var verified = passwordHash.verify(oldpassword , encryptedPwd);
		if(!verified)
			return callback({status : "FAILED" , msg : "Wrong password"});
	}
	var newEncPwd = passwordHash.generate(newpassword);
	var updated_at = new Date();
	//var usedmanuallogin = 1;
	query("update users set password = $1 , updated_at = $2 , usedmanuallogin = 1 where id = $3" , [newEncPwd , updated_at , userid] , function(err , res){
		if(err)
		{	
			return callback({status : "FAILED" , msg : "Can not update users table"});
		}
		else
		{
			return callback({status : "SUCCESS" , msg : ""});
		}
	});

}

exports.changeCompanyProfile = function(param , callback)
{
	var companyid = param.companyid;
	var companyname = param.companyname;
	var companydesc = param.companydesc;
	if(!companyid || !companyname || !companydesc)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query("update companies set name = $1 , description = $2 where id = $3" , [companyname , companydesc , companyid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not update companies table"});
		}
		else
		{
			return callback({status : "SUCCESS" , msg : ""});
		}
	});
}

exports.getCompanyInfo = function(companyid , callback)
{
	if(!companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query("select companies.* from companies where companies.id = $1" , [companyid] , function(err, res){
		if(err)
		{
			return callback({status: "FAILED" , msg : "Can not get company info"});
		}
		else
		{
			if(res.rows.length != 1)
				return callback({status : "FAILED" , msg : "No company"});

			var company = res.rows[0];
			return callback({status : "SUCCESS" , msg : company});
		}
	});
}

exports.getCompanyMembers = function(companyid , userid , offset , callback)
{
	if(!companyid || !userid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	var offsets = parseInt(offset) * 10;
	query("select count(id) as counts from users where users.companyid = $1 and users.status <> 2 and users.id <> $2" , [companyid , userid] , function(err1 , res1){
		if(err1)
		{
			return callback({status : "FAILED" , msg : "Can not get the number of company members"});
		}
		else
		{
			var counts = res1.rows[0].counts;
			if(counts > 0)
			{
				query("select users.* from users where users.companyid = $1 and users.status <> 2 and users.id <> $2 offset $3 limit 10" , [companyid , userid , offsets] , function(err , res){
					if(err)
					{
						return callback({status : "FAILED" , msg : "Can not get company members"});
					}
					else
					{
						return callback({status : "SUCCESS" , msg : res.rows , counts : counts});
					}
				});	
			}
			else
			{
				return callback({status : "SUCCESS" , msg : [] , counts : 0});
			}
			
		}
	});
	
}

exports.removeMember = function(param , callback)
{
	var updated_at = new Date();
	var userid = param.userid;
	var companyid = param.companyid;
	if(!userid || !companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query("update users set companyid = -1 , privatemember = 0 , roleid = 3 , updated_at = $3 where id = $1 and companyid = $2 and status <> 2" , [userid , companyid , updated_at] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not update users table"});
		}
		else
		{
			//should change threads company info
			var updated_at = new Date();
			query("update threads set companyid = -1 , isprivate = 0 , updated_at = $2 where userid = $1" , [userid , updated_at] , function(err3 , res3){
				if(err3)
				{
					return callback({status : "FAILED" , msg : "Can not update threads"});
				}
				else
				{
					query("update configs set isorgconfig = 0 , companyid = -1 , updated_at = $2 where userid = $1" , [userid , updated_at] , function(err2 , res2){
						if(err2)
						{
							return callback({status : "FAILED" , msg : "Can not update configs"});
						}
						else
						{
							return callback({status : "SUCCESS" , msg : ""});
						}	
					});
				}
			});
		}
	});
}

exports.changeUserPermission = function(param , callback)
{
	var updated_at = new Date();
	var userid = param.userid;
	var companyid = param.companyid;
	var privatemember = parseInt(param.privatemember);
	if(!userid || !companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	if(privatemember > 0)
		privatemember = 1;
	else
		privatemember = 0;
	query("update users set updated_at = $1 , privatemember = $2 where id = $3 and companyid = $4 and status <> 2" , [updated_at , privatemember , userid , companyid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not update users table"});
		}
		else
		{
			return callback({status : "SUCCESS" , msg : ""});
		}
	});
}

exports.getNormalUsers = function(companyid , offset , searchkey , callback)
{
	if(!companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	offset = parseInt(offset) * 10;
	query("select count(id) as counts from users where username like '%" + searchkey + "%' and status <> 0 and companyid = -1 and roleid = 3 offset $1 limit 10" , [offset] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get max id from users table"});
		}
		else
		{	
			var counts = res.rows[0].counts;
			if(counts == 0)
			{
				return callback({status : "SUCCESS" , msg : [] , counts : 0});
			}
			else
			{
				query("select t1.* , t2.useremail as useremail from users as t1 left join (select useremail from invites where companyid = $2 and status = 0 group by useremail) as t2 on t1.email = t2.useremail where t1.username like '%" + searchkey + "%' and t1.status <> 0 and t1.companyid = -1 and t1.roleid = 3 offset $1 limit 10" , [offset , companyid] , function(err1 , res1){
					if(err1)
					{
						return callback({status : "FAILED" , msg : "Can not get users from users table"});
					}
					else
					{

						return callback({status : "SUCCESS" , msg : res1.rows , counts : counts});
					}
				});
			}
		}
	});

}

exports.inviteMember = function(param , callback)
{
	var useremail = param.useremail;
	var companyid = parseInt(param.companyid);
	if(!useremail || !companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	var created_at = new Date();
	query('select max(id) as maxid from invites' , [] , function(err , res){
		if(err)
		{
			console.log(err.message);
			return callback({status : "FAILED" , msg : "Can not get max id from invites"});
		}
		else
		{	
			var maxid = res.rows[0].maxid + 1;
			query("insert into invites(id , useremail , companyid , invited_at , status) values($1 , $2 , $3 , $4 , 0)" , [maxid , useremail , companyid , created_at] , function(err1, res1){
				if(err1)
				{
					return callback({status : "FAILED" , msg : "Can not insert into invites table"});
				}
				else
				{
					return callback({status : "SUCCESS" , msg : ""});
				}
			});
		}
	})
}
exports.getInvites = function(useremail , callback)
{
	if(!useremail)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query('select t1.* , t2.name , t2.description from (select max(id) as id, companyid , max(invited_at) invited_at from invites where useremail = $1 and status = 0 group by companyid) as t1  left join companies as t2 on t2.id = t1.companyid' , [useremail] , function(err, res){
		if(err)
		{
			return  callback({status : "FAILED" , msg : "Can not get invite info"});
		}
		else
		{
			return callback({status : "SUCCESS" , msg : res.rows});
		}
	});
}
exports.getUserThreads = function(userid , callback)
{
	if(!userid)
		return callback({status : "FAILED" , msg : "Too few inputs"});

	query("select * from threads where userid = $1" , [userid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get user threads"});
		}
		else
		{
			return callback({status : "SUCCESS" , msg : res.rows});
		}
	});
	
}
exports.acceptInvite = function(param , callback)
{
	var useremail = param.useremail;
	var inviteid = param.inviteid;
	var userid = param.userid;
	if(!useremail || !inviteid || !userid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	//get inviteinfo
	query('select * from invites where id = $1 and status = 0 and useremail = $2' , [inviteid , useremail] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get invites"});
		}
		else
		{
			var invite = res.rows;
			if(invite.length != 1)
				return callback({status : "FAILED" , msg : "Wrong invite"});
			invite = invite[0];
			var updated_at = new Date();
			//update users table
			query('update users set companyid = $1 , roleid = 2 , updated_at = $2 where email = $3' , [invite.companyid , updated_at , useremail] , function(err ,res){
				if(err)
				{	
					return callback({status : "FAILED" , msg : "Can not update users table"});
				}
				else
				{
					//update invites table
					query('update invites set status = 1 where companyid = $1 and useremail = $2' , [invite['companyid'] , useremail] , function(err1 , res1){
						if(err1)
						{
							return callback({status : "FAILED" , msg : "Can not update invites table"});
						}
						else
						{
							//should change threads company info
							var updated_at = new Date();
							query("update threads set companyid = $1 , isprivate = 0 , updated_at = $3 where userid = $2" , [invite.companyid , userid , updated_at] , function(err3 , res3){
								if(err3)
								{
									return callback({status : "FAILED" , msg : "Can not update threads"});
								}
								else
								{
									query("update configs set companyid = $1 , isorgconfig = 0 , updated_at = $3 where userid = $2" , [invite.companyid , userid , updated_at] , function(err3 , res3){
										if(err3)
										{
											return callback({status : "FAILED" , msg : "Can not update threads"});
										}
										else
										{
											return callback({status : "SUCCESS" , msg : ""});
										}
									});
								}
							});
						}
					});
				}
			});
		}
	});
}

exports.rejectInvite = function(param , callback)
{
	var useremail = param.useremail;
	var inviteid = param.inviteid;
	if(!useremail || !inviteid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	//get inviteinfo
	query('select * from invites where id = $1 and status = 0 and useremail = $2' , [inviteid , useremail] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get invites"});
		}
		else
		{
			var invite = res.rows;
			if(invite.length != 1)
				return callback({status : "FAILED" , msg : "Wrong invite"});
			invite = invite[0];

			//update invites table
			query('update invites set status = 2 where companyid = $1 and useremail = $2' , [invite['companyid'] , useremail] , function(err1 , res1){
				if(err1)
					return callback({status : "FAILED" , msg : "Can not update invites table"});
				else
					return callback({status : "SUCCESS" , msg : ""});
			});

		}
	});
}
exports.closeThread = function(param , callback)
{
	var roleid = param.roleid;
	var userid = param.userid;
	var privatemember = param.privatemember;
	var threadid = param.threadid;
	var companyid = param.companyid;
	if(!threadid || !companyid || !userid || !roleid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query('select * from threads where id = $1 and status = 0' , [threadid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get thread info"});
		}
		else
		{	
			var thread = res.rows;
			if(thread.length != 1)
				return callback({status : "FAILED" , msg : "Wrong thread"});
			thread = thread[0];

			if(thread.isprivate == 1 && privatemember == 0)
				return callback({status : "FAILED" , msg : "You have no permssion to close this thread"});

			if(thread.userid != userid && (roleid != 1 || roleid == 1 && companyid != thread.companyid))
				return callback({status : "FAILED" , msg : "You have no permission to close this thread"});

			query('update threads set status = 1 where id = $1' , [threadid] , function(err1 , res1){
				if(err1)
				{
					return callback({status : "FAILED" , msg : "Can not update threads table"});
				}
				else
				{
					return callback({status : "SUCCESS" , msg : ""});
				}
			});

		}
	});
}

exports.makePrivateThread = function(param , callback)
{
	var roleid = param.roleid;
	var userid = param.userid;
	var companyid = param.companyid;
	var privatemember = param.privatemember;
	var isprivate = param.isprivate;
	var threadid = param.threadid;
	if(parseInt(isprivate) > 0)
		isprivate = 1;
	else
		isprivate = 0;
	if(!threadid || !companyid || !userid || !roleid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query('select * from threads where id = $1 and status = 0' , [threadid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get thread info"});
		}
		else
		{	
			var thread = res.rows;
			if(thread.length != 1)
				return callback({status : "FAILED" , msg : "Wrong thread"});
			thread = thread[0];

			if(thread.isprivate == 1 && privatemember == 0)
				return callback({status : "FAILED" , msg : "You have no permission to change this thread"});

			if(thread.userid != userid && (roleid != 1 || roleid == 1 && companyid != thread.companyid))
				return callback({status : "FAILED" , msg : "You have no permission to change this thread"});

			var sql = "update threads set isprivate = 1  where id = $1";
			if(isprivate == 0)
				var sql = "update threads set isprivate = 0  where id = $1";
			query(sql , [threadid] , function(err1 , res1){
				if(err1)
				{
					return callback({status : "FAILED" , msg : "Can not update threads table"});
				}
				else
				{
					return callback({status : "SUCCESS" , msg : ""});
				}
			});

		}
	});
}
exports.makePrivateConfig = function(param , callback)
{
	var roleid = param.roleid;
	var userid = param.userid;
	var companyid = param.companyid;
	var privatemember = param.privatemember;
	var isorgconfig = param.isorgconfig;
	var configid = param.configid;
	if(parseInt(isorgconfig) > 0)
		isorgconfig = 1;
	else
		isorgconfig = 0;
	if(!configid || !companyid || !userid || !roleid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query('select * from configs where id = $1' , [configid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get configs info"});
		}
		else
		{	
			var config = res.rows;
			if(config.length != 1)
				return callback({status : "FAILED" , msg : "Wrong config"});
			config = config[0];

			if(config.isorgconfig == 1 && privatemember == 0)
				return callback({status : "FAILED" , msg : "You have no permission to change this thread"});

			if(config.userid != userid && (roleid != 1 || roleid == 1 && companyid != config.companyid))
				return callback({status : "FAILED" , msg : "You have no permission to change this thread"});

			var sql = "update configs set isorgconfig = 1  where id = $1";
			if(isorgconfig == 0)
				var sql = "update configs set isorgconfig = 0  where id = $1";
			query(sql , [configid] , function(err1 , res1){
				if(err1)
				{
					return callback({status : "FAILED" , msg : "Can not update configs table"});
				}
				else
				{
					return callback({status : "SUCCESS" , msg : ""});
				}
			});

		}
	});
}
exports.getCompanyThreads = function(companyid , callback)
{
	if(!companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});

	query("select t1.* , t2.username as username from threads as t1 left join users as t2 on t1.userid = t2.id where t2.companyid = $1" , [companyid] , function(err, res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get company threads"});
		}
		else
		{
			return callback({status : "SUCCESS" , msg : res.rows});
		}
	});
}
exports.getCompanyConfigs = function(companyid , callback)
{
	if(!companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});

	query("select t1.* , t2.username as username from configs as t1 left join users as t2 on t1.userid = t2.id where t2.companyid = $1" , [companyid] , function(err, res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get company threads"});
		}
		else
		{
			return callback({status : "SUCCESS" , msg : res.rows});
		}
	});
}
exports.createNewConfig = function(param , callback)
{
	var content = param.content;
	var userid = param.userid;
	var title = param.title;
	var companyid = param.companyid;
	if(!content || !userid || !title || !companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});

	//get max id
	query("select max(id) as maxid from configs" , [] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get configs info"});
		}
		else
		{
			var maxid = res.rows[0].maxid + 1;
			var created_at = new Date();
			var updated_at = new Date();
			var fileUrl = uuid.v4() + ".json";
			fileUrl = path.join(__dirname , '../configs') + "/" + fileUrl;
			fs.writeFile(fileUrl , content , function(err2){
				if(err2)
				{
					return callback({status : "FAILED" , msg : "Can not save file"});
				}
				else
				{
					query("insert into configs (id , content , created_at , updated_at , userid , likes , isorgconfig , title , companyid , fileUrl) values ($1 , $2 , $3 , $4 , $5 , $6 , $7 , $8 , $9 , $10)" 
						, [maxid , content , created_at , updated_at , userid , 0 , 0 , title , companyid , fileUrl] , function(err1 , res1){
							if(err1)
							{
								return callback({status : "FAILED" , msg : "Can not insert into configs table"});
							}
							else
							{
								return callback({status : "SUCCESS" , msg : ""});
							}
						});
				}
			});
		
		}
	});

}

exports.getConfigs = function(param , callback)
{
	var userid = param.userid;
	var companyid = param.companyid;
	var searchkey = param.searchkey;
	var offset = param.offset;
	if(!userid || !companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	offset = parseInt(offset) * 10;
	query("select count(configs.id) as counts from configs left join users on configs.userid = users.id where (configs.title like '%" + searchkey + "%' or configs.content like '%" + searchkey + "%') and (configs.isorgconfig = 0 or configs.companyid = $1) offset $2 limit 10 " 
		, [companyid , offset] , function(err1 , res1){
			if(err1)
			{
				return callback({status : "FAILED" , msg : "Can not get counts of configs"});
			}
			else
			{
				var counts = res1.rows[0].counts;
				if(counts == 0)
					return callback({status : "SUCCESS" , msg : [] , counts : 0});
				query("select configs.* , users.username from configs left join users on configs.userid = users.id where (configs.title like '%" + searchkey + "%' or configs.content like '%" + searchkey + "%') and (configs.isorgconfig = 0 or configs.companyid = $1) offset $2 limit 10 " 
					, [companyid , offset] , function(err , res){
						if(err)
						{
							return callback({status : "FAILED" , msg : "Can not get configs info"});
						}
						else
						{
							return callback({status : "SUCCESS" , msg : res.rows , counts : counts});
						}
					});
			}
			
		});
	
}

exports.getConfigOne = function(param , callback)
{
	var configid = param.configid;
	var companyid = param.companyid;
	var privatemember = param.privatemember;
	if(!configid)
		return callback({status : "FAILED" , msg : "Too few inputs"});

	query("select * from configs where id = $1" , [configid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get info from configs"});
		}
		else
		{
			if(res.rows.length != 1)
				return callback({status : "FAILED" , msg : "Wrong config id"});
			var config = res.rows[0];

			if(config.isorgconfig == 1 && companyid != config.companyid)
				return callback({status : "FAILED" , msg : "Permission denied"});

			return callback({status : "SUCCESS" , msg : config});			
		}
	});
}

exports.updateConfig = function(param , callback)
{
	var content = param.content;
	var userid = param.userid;
	var title = param.title;
	var companyid = param.companyid;
	var configid = param.configid;
	var roleid = param.roleid;
	if(!content || !userid || !title || !companyid || !configid || !roleid)
		return callback({status : "FAILED" , msg : "Too few inputs"});

	query("select * from configs where id = $1" , [configid] , function(err1 , res1){
		if(err1)
		{
			return  callback({status : "FAILED" , msg : "Can not get configs"});
		}
		else
		{
			var config = res1.rows;
			if(config.length != 1)
				return callbacK({status : "FAILED" , msg : "Wrong config id"});
			
			config = config[0];
			if(userid != config.userid && (roleid != 1 || (roleid == 1 && companyid != config.companyid)))
				return callback({status : "FAILED" , msg : "You have no permission"});

			var updated_at = new Date();
			fs.writeFile(config.fileurl , content , function(err2){
				if(err2)
				{
					return callback({status : "FAILED" , msg : "Can not update file"});
				}
				else
				{
					query("update configs set updated_at = $1 , content = $2 , title = $3 where id = $4" , [updated_at , content , title , configid] , function(err , res){
						if(err)
						{
							return callback({status : "FAILED" , msg : "Can not update configs table"});
						}
						else
						{
							return callback({status : "SUCCESS" , msg : ""});
						}
					});
				}
			});

		}
	});
		
}
exports.likeconfig = function(param , callback)
{
	var configid = param.configid;
	var userid = param.userid;
	var privatemember = param.privatemember;
	var companyid = param.companyid;
	if(!configid || !userid || !companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query("select * from configs where id = $1" , [configid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get info from configs"});
		}
		else
		{
			if(res.rows.length != 1)
				return callback({status : "FAILED" , msg : "Wrong config id"});
			var config = res.rows[0];
			if(config.userid == userid)
				return callback({status : "FAILED" , msg : "The same user"});
			if(config.isorgconfig == 1 && companyid != config.companyid)
				return callback({status : "FAILED" , msg : "Permission denied"});
			if(config.isorgconfig == 1 && companyid == config.companyid && privatemember != 1)
				return callback({status : "FAILED" , msg : "Permission denied"});

			var likes = config.likes + 1;
			var updated_at = new Date();
			query("update configs set likes = $1 , updated_at = $3 where id = $2" , [likes , configid , updated_at] , function(err1 , res1){
				if(err1)
				{
					return callback({status : "FAIELD" , msg : "Can not get info from configs"});
				}
				else
				{
					return callback({status : "SUCCESS" , msg : likes});
				}
			});	
		}
	});

}
exports.unlikeconfig = function(param , callback)
{
	var configid = param.configid;
	var userid = param.userid;
	var privatemember = param.privatemember;
	var companyid = param.companyid;
	if(!configid || !userid || !companyid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query("select * from configs where id = $1" , [configid] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get info from configs"});
		}
		else
		{
			if(res.rows.length != 1)
				return callback({status : "FAILED" , msg : "Wrong config id"});
			var config = res.rows[0];
			if(config.userid == userid)
				return callback({status : "FAILED" , msg : "The same user"});
			if(config.isorgconfig == 1 && companyid != config.companyid)
				return callback({status : "FAILED" , msg : "Permission denied"});
			if(config.isorgconfig == 1 && companyid == config.companyid && privatemember != 1)
				return callback({status : "FAILED" , msg : "Permission denied"});

			var likes = config.likes - 1;
			if(likes < 0)
				likes = 0;
			var updated_at = new Date();
			query("update configs set likes = $1 , updated_at = $3 where id = $2" , [likes , configid , updated_at] , function(err1 , res1){
				if(err1)
				{
					return callback({status : "FAIELD" , msg : "Can not get info from configs"});
				}
				else
				{
					return callback({status : "SUCCESS" , msg : likes});
				}
			});	
		}
	});

}
exports.getUserConfigs = function(userid , callback)
{
	if(!userid)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query("select * from configs where userid = $1" , [userid] , function(err ,res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not read configs table"});
		}
		else
		{
			return callback({status : "SUCCESS" , msg : res.rows});
		}
	});
}
exports.forgot = function(email , callback)
{
	if(!email)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query("select count(id) as counts from users where email = $1" , [email] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not get info from users table"});
		}
		else
		{
			var counts = res.rows[0].counts;
			if(counts != 1)
				return callback({status : "FAILED" , msg : "Wrong email"});
			var token = uuid.v4();

			query("update users set resetpasswordtoken = $1  where email = $2" , [token , email] , function(err1 , res1){
				if(err1)
				{
					return callback({status : "FAILED" , msg : "Can not update users table"});
				}
				else
				{
					return callback({status : "SUCCESS" , msg : token});
				}
			});
		}
	});
}

exports.acceptForgotPassword = function(token , callback)
{
	if(!token)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query("select * from users where resetpasswordtoken = $1" , [token] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not read users table"});
		}
		else
		{
			var user = res.rows;
			if(user.length != 1)
				return callback({status : "FAILED" , msg : "Wrong token"});
			user = user[0];
			var password = lib.randomStringGenerate(6).output_1;
			var encryptedPwd = passwordHash.generate(password);
			query("update users set password = $1 , resetpasswordtoken = $2 , usedmanuallogin = 1 where resetpasswordtoken = $3" , [encryptedPwd , "" , token] , function(err1 , res1){
				if(err1)
				{
					return callback({status : "FAILED" , msg : "Can not update users table"});
				}
				else
				{
					return callback({status : "SUCCESS" , msg : {email : user.email , password : password}});
				}
			});
		}
	});
}
exports.cancelForgotPassword = function(token , callback)
{
	if(!token)
		return callback({status : "FAILED" , msg : "Too few inputs"});
	query("select * from users where resetpasswordtoken = $1" , [token] , function(err , res){
		if(err)
		{
			return callback({status : "FAILED" , msg : "Can not read users table"});
		}
		else
		{
			var user = res.rows;
			
			if(user.length != 1)
				return callback({status : "FAILED" , msg : "Wrong token"});
			user = user[0];
			query("update users set resetpasswordtoken = $1 where resetpasswordtoken = $2" , ["" , token] , function(err1 , res1){
				if(err1)
				{
					return callback({status : "FAILED" , msg : "Can not update users table"});
				}
				else
				{
					return callback({status : "SUCCESS" , msg : ""});
				}
			});
		}
	});
}