var GOOGLE_CLIENT_ID = '222711782962-i8798ocpt71v4d9gq0g04bsks9mmjd70.apps.googleusercontent.com';
var FACEBOOK_APP_ID = '298901640895550';
function showDanger(str)
{
	$('div.alert-danger').css({'display' : 'block'});
	$('div.alert-success').css({'display' : 'none'});
	$('div.alert-danger').text(str);
	$('div.alert-success').text("");

	setTimeout(function(){
		$('div.alert-danger').fadeOut(2000);
	} , 1500);
}
function showSuccess(str)
{
	$('div.alert-success').css({'display' : 'block'});
	$('div.alert-danger').css({'display' : 'none'});
	$('div.alert-success').text(str);
	$('div.alert-danger').text("");

	setTimeout(function(){
		$('div.alert-success').fadeOut(2000);
	} , 1500);
}
// for config only
function showWarningModal(warning)
{
	$("#warningtext").text(warning);
	$("#warningmodal").modal();
}
//for config only
/* signup page begin */
/* signup with email and password */
function loginByEmail()
{
	var username = $('input[name="username"]').val();
	var password = $('input[name="password"]').val();
	var rememberme = (($('#exampleRadios1')[0].checked==true)?1:0);
	loginUser(username , password , 1 , rememberme);
}
function signUpByEmail()
{
	var username = $('input[name="username"]').val();
	var password = $('input[name="password"]').val();
	var email = $('input[name="email"]').val();
	if(!validateCredentials(username , password , email))
		return;
	registerUser(username , password , email , 1);

}
function validateCredentials(username , password , email)
{
	if(!username)
	{
		showDanger("Please fill username");
		return false;
	}
	if(!checkEmail(email))
	{	
		showDanger("Please use valid email");
		return false;
	}
	if(!password)
	{	
		showDanger("Please fill password");
		return false;
	}
	if(!checkPassword(password))
	{
		showDanger("Please use strong password");
		return false;
	}
	return true;
}
function checkPassword(password)
{
	if(password.length < 8)
		return false;
	var num = /[^a-z]/g;
	if(!password.match(num))
		return false;
	return true;
}
function checkEmail(email)
{
	var email_parts = email.split("@");
	if(email_parts.length != 2 || email_parts[0].length == 0 || email_parts[1].length == 0)
		return false;
	return true;
}
function sendPasswordResetEmail()
{
	var email = $('input[name="resetpassword"]').val();
	$.ajax({
		url : "/forgot",
		type : "POST",
		data : {email : email},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				showSuccess("Password reset email sent. Please check you mail box");
			}
			else
			{	
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	});
}
/* sign up with email and password */

/*google login api begin*/
var googleUser = {};
var startApp = function() {
	gapi.load('auth2', function(){

	  	auth2 = gapi.auth2.init({
		    client_id: GOOGLE_CLIENT_ID,
		    cookiepolicy: 'single_host_origin',

	  	});
	  	attachSignin(document.getElementById('google-signup'));
	});
};
function attachSignin(element) {
	console.log(element.id);
	auth2.attachClickHandler(element, {},
	    function(googleUser) {
	    	
	    	if(googleUser)
	    	{
		    	var googleUserProfile = googleUser.getBasicProfile();
		    	var username = googleUserProfile.getName();
		    	var email = googleUserProfile.getEmail();
		    	var id_token = googleUser.getId();
		    	console.log(id_token);
		    	if(action == "signup")
		    		registerUser(username , id_token , email , 0);
		    	else
		    		loginUser(email , id_token , 1 , 0);
	    	}
	    	else
	    	{
	    		location.href = "/error";
	    	}
	      	
	    }, function(error) {
	      	/* alert(JSON.stringify(error, undefined, 2));*/
    });
}
/*google login api end*/

/*facebook login api begin */
function signUpByFacebook()
{
	FB.getLoginStatus(function(response) {
	  statusChangeCallback(response);
	});
}
// This is called with the results from from FB.getLoginStatus().
function statusChangeCallback(response) {
	console.log('statusChangeCallback');
	console.log(response);
	// The response object is returned with a status field that lets the
	// app know the current login status of the person.
	// Full docs on the response object can be found in the documentation
	// for FB.getLoginStatus().
	if (response.status === 'connected') {
	  // Logged into your app and Facebook.
	  testAPI(response);
	} else {
	  // The person is not logged into your app or we are unable to tell.
	  document.getElementById('status').innerHTML = 'Please log ' +
	    'into this app.';
	}
}

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState() {
	FB.getLoginStatus(function(response) {
	  statusChangeCallback(response);
	});
}

window.fbAsyncInit = function() {
	FB.init({
	  appId      : FACEBOOK_APP_ID,
	  cookie     : true,  // enable cookies to allow the server to access 
	                      // the session
	  xfbml      : true,  // parse social plugins on this page
	  version    : 'v2.8' // use graph api version 2.8
	});

// Now that we've initialized the JavaScript SDK, we call 
// FB.getLoginStatus().  This function gets the state of the
// person visiting this page and can return one of three states to
// the callback you provide.  They can be:
//
// 1. Logged into your app ('connected')
// 2. Logged into Facebook, but not your app ('not_authorized')
// 3. Not logged into Facebook and can't tell if they are logged into
//    your app or not.
//
// These three cases are handled in the callback function.

//following function should not occur automatically.
// FB.getLoginStatus(function(response) {
//   statusChangeCallback(response);
// });

};

// Here we run a very simple test of the Graph API after login is
// successful.  See statusChangeCallback() for when this call is made.
function testAPI(response) {
	console.log('Welcome!  Fetching your information.... ');
	let userId = response.authResponse.userID;
	getUserInfo(userId);
}
function getUserInfo(userId) {
    // body...
    FB.api(
      '/'+userId+'/?fields=id,name,email',
      'GET',
      {},
      function(response) {
        // Insert your code here
        // console.log(response);
        let email = response.email;
        if(action == "signup")
        	registerUser(response.name , response.id , response.email , 0);
        else
        	loginUser(response.email , response.id , 1 , 0);
      }
    );
}
/*facebook login api end */
/* linked in login api begin */
function signUpByLinkedin()
{
	// $('#linkedin_login span span span a')[0].click();
	IN.User.authorize(function(){
       onLinkedInAuth();
   });
}
function onLinkedInAuth() {
    var mem_id = IN.ENV.auth.member_id;
    
    IN.API.Profile("me").fields("first-name", "last-name", "email-address").result(function (data) {
        var email = data.values[0].emailAddress;
        var password = mem_id;//use mem_id as password
        var username = email.split("@")[0];
        if(action == "signup")
        	registerUser(username , password , email , 0);
        else
        	loginUser(email , password , 1 , 0)

    }).error(function (data) {
        showDanger("Linkedin sign in has a problem");
    });
}
/* linked in login api end */
function registerUser(username , password , email , shouldenc)
{
	$.ajax({
		url : "/signup",
		type : "POST",
		data : {
			username : username,
			password : password,
			email : email,
			shouldenc : shouldenc
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				location.href = "/user-profile";
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + ":" + err.status);
		}
	});
}

function loginUser(username , password , shouldenc , rememberme)
{
	$.ajax({
		url : "/login",
		type : "POST",
		data : {
			username : username,
			password : password,
			shouldenc : shouldenc,
			rememberme : rememberme
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				location.href = "/user-profile";
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + ":" + err.status);
		}
	});
}
/* signup page end */
/* forum page begin */

function createNewThread()
{
	location.href = "/forum/create-thread";
}
function createOneThread()
{
	var title = $('input[name="title"]').val();
	var content = $('textarea[name="content"]').val();
	var keywords = $('input[name="keywords"]').val();
	var isprivate = (($('#isprivate')[0].checked == true)?1:0);
	if(!title)
		return showDanger("Please enter your thread's title");
	if(title.length > 60)
		return	showDanger("The title is too long");
	if(!content)
		return showDanger("Please enter your thread's content");

	$.ajax({
		url : "/forum/create-thread",
		type : "POST",
		data : {
			title : title,
			content : content,
			keywords : keywords,
			isprivate : isprivate,
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				showSuccess("Thread successfully created");
				$('input[name="title"]').val("");
				$('textarea[name="content"]').val("");
				$('input[name="keywords"]').val("");
				$('#isprivate')[0].checked = false;
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + ":" + err.status);
		}
	});

}
function cancelOneThread()
{
	location.href = "/forum";
}
function createReply(threadid)
{
	var content = $('textarea[name="content"]').val();
	if(!threadid)
		return;
	$.ajax({
		url : "/forum/createreply",
		type : "POST",
		data : {
			threadid : threadid,
			content : content
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				showSuccess("Successfully replied");
				$('textarea[name="reply"]').val("");
				addNewReply(response.msg);
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + ":" + err.status);
		}
	});
}
function addNewReply(reply)
{
	var newreply ='<div class = "col-12 ">' + 
						'<div class="card mb-3">' +
							  	'<div class="card-header container-fluid">' +
						  	
						  		'<img class = "forum-icon" src = "' + ((reply['photo'])?(reply['photo']):("/img/default-user.png")) + '">'+reply['username']+'&nbsp;<span class = "text-secondary">replied at '+reply['created_at'].slice(0 , 16).replace("T" , " ")+'</span>' + 
								  
						  	'</div>' +
						  	'<div class="card-body">' +
						    	'<pre class="card-text">'+reply['content']+'</pre>' +
						  	'</div>' +
						'</div>' +
					'</div>';
	$('#messageWrapper').append(newreply);
}
/**********************************************************pagination begin******************************************************/
function goSearchKeyword()
{
	var baseurl = "/" + $('#paginationInfo').data('base');

	var searchkey = $('input[name="searchkey"]').val();
	location.href = baseurl + "?searchkey=" + searchkey + "&offset=0";
}
function goFirst()
{
	var offset = parseInt($('#paginationInfo').text());

	var searchkey = $('input[name="searchkey"]').val();

	var baseurl = "/" + $('#paginationInfo').data('base');

	if(offset != 1)
		location.href = baseurl + "?searchkey=" + searchkey + "&offset="+0;
}
function goPrev()
{
	var offset = parseInt($('#paginationInfo').text()) - 2;
	var searchkey = $('input[name="searchkey"]').val();

	var baseurl = "/" + $('#paginationInfo').data('base');

	if(offset >= 0)
		location.href = baseurl + "?searchkey=" + searchkey + "&offset="+offset;
}
function goNext()
{
	var searchkey = $('input[name="searchkey"]').val();
	var offset = parseInt($('#paginationInfo').text());

	var max_offset = (parseInt($('#paginationInfo').data('count')) - (parseInt($('#paginationInfo').data('count')) % 10)) / 10;
	if(parseInt($('#paginationInfo').data('count')) % 10 == 0)
		max_offset --;
	if(max_offset < 0)
		max_offset = 0;

	var baseurl = "/" + $('#paginationInfo').data('base');

	if(offset <= max_offset)
		location.href = baseurl + "?searchkey=" + searchkey + "&offset="+offset;
}
function goLast()
{
	var offset = parseInt($('#paginationInfo').text()) - 1;

	var max_offset = (parseInt($('#paginationInfo').data('count')) - (parseInt($('#paginationInfo').data('count')) % 10)) / 10;
	if(parseInt($('#paginationInfo').data('count')) % 10 == 0)
		max_offset --;
	if(max_offset < 0)
		max_offset = 0;

	var baseurl = "/" + $('#paginationInfo').data('base');

	var searchkey = $('input[name="searchkey"]').val();
	if(offset != max_offset)
		location.href = baseurl + "?searchkey=" + searchkey + "&offset="+max_offset;
}
/***********************************************************pagination end*********************************************************/
/* forum page end */

/* config page begin */
/*
*arcapp_conf {is_enable_logging:true , is_run_on_start_up:false , is_run_as_admin:false , is_turn_on_launch:false ,
*			is_use_default_log_path:true , log_path:.\\bin , ssl_for_app:false , is_enable_voice_sync:true , voice_trigger_word:my, friend}
*/

function increaseLikes(id)
{
	$.ajax({
		url : "/config/like",
		type : "POST",
		data : {
			configid : id
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				$('#configlikes').text(response.msg);
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	});
}
function decreaseLikes(id)
{
	$.ajax({
		url : "/config/unlike",
		type : "POST",
		data : {
			configid : id
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				$('#configlikes').text(response.msg);
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	});
}
function downloadConfig(configid)
{

	// $.ajax({
	// 	url : '/config/download',
	// 	type : "GET",
	// 	data : {
	// 		configid : configid
	// 	},
	// 	success : function(response)
	// 	{
	// 		if(response.status == "FAILED")
	// 		{
	// 			showDanger(response.msg);
	// 		}
	// 	},
	// 	error : function(err)
	// 	{
	// 		showDanger(err.statusText + " : " + err.status);
	// 	}
	// });
	location.href = "/config/download?configid=" + configid;

}

function makePrivateConfig(configid)
{
	var isorgconfig = (($('#privatecheck' +  configid)[0].checked)?1:0);
	$.ajax({
		url : "/user-profile/config/makeprivate",
		data : {
			configid : configid,
			isorgconfig : isorgconfig
		},
		type : "POST",
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{

			}
			else
			{
				$('#privatecheck' + configid)[0].checked = !($('#privatecheck' + configid)[0].checked);
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			$('#privatecheck' + configid)[0].checked = !($('#privatecheck' + configid)[0].checked);
			showDanger(err.statusText + " : " + err.status);
		}
	});	
}
function changeConfigTitleAndUpdateConfig(configid)
{
	var toSaveConfig = JSON.stringify(config);
	var configTitle = $('input[name="config_title"]').val();
	if(!configTitle)
		return showWarningModal("Please fill config title field");
	$.ajax({
		url : '/config/edit-config/update',
		data : {
			config : toSaveConfig,
			title : configTitle,
			configid : configid
		},
		type : "POST",
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				// location.href = "/user-profile/config";
				$('#confignamemodal').modal('hide');
			}
			else
			{
				showDanger(response.msg);
				$('#confignamemodal').modal('hide');	
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
			$('#confignamemodal').modal('hide');
		}
	});
}
function changeConfigTitleAndSaveConfig()
{
	var toSaveConfig = JSON.stringify(config);
	var configTitle = $('input[name="config_title"]').val();
	if(!configTitle)
		return showWarningModal("Please fill config title field");
	$.ajax({
		url : '/config/create-config/save',
		data : {
			config : toSaveConfig,
			title : configTitle
		},
		type : "POST",
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				location.href = "/user-profile/config";
			}
			else
			{
				showDanger(response.msg);
				$('#confignamemodal').modal('hide');	
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
			$('#confignamemodal').modal('hide');
		}
	});
}
function saveConfig()
{
	$('#confignamemodal').modal();	
}

function saveAppSettings()
{
	var appSettings = {};
	appSettings['runasadmin'] = $('#runasadmincheck')[0].checked;
	appSettings['runonstartup'] = $('#runonstartupcheck')[0].checked;
	appSettings['turnonlaunch'] = $('#turnonlaunchcheck')[0].checked;
	appSettings['usepassword'] = $('#usepasswordcheck')[0].checked;
	appSettings['enablevoicesync'] = $('#enablevoicesynccheck')[0].checked;
	appSettings['enablelogging'] = $('#enableloggingcheck')[0].checked;
	appSettings['usedefaultpath'] = $('#usedefaultpathcheck')[0].checked;
	appSettings['log_path'] = $('input[name="log_path"]').val();
	appSettings['triggerword1'] = $('input[name="triggerword1"]').val();
	appSettings['triggerword2'] = $('input[name="triggerword2"]').val();

	config['arcapp_conf'] = appSettings; 
}
function uploadAppSettings()
{
	$('input[name="appconfigfile"]').trigger('click');
}

function uploadEntries()
{
	$('input[name="commandsconfigfile"]').trigger('click');
}
function onappconfigfilechanged(appConf)
{
  	config['arcapp_conf'] = appConf;
  	$('#runasadmincheck')[0].checked = ((appConf['runasadmin']==1)?true:false);
  	$('#runonstartupcheck')[0].checked = ((appConf['runonstartup']==1)?true:false);
  	$('#turnonlaunchcheck')[0].checked = ((appConf['turnonlaunch']==1)?true:false);
  	$('#usepasswordcheck')[0].checked = ((appConf['usepassword']==1)?true:false);
  	$('#enablevoicesynccheck')[0].checked = ((appConf['enablevoicesync']==1)?true:false);
  	$('#usedefaultpathcheck')[0].checked = ((appConf['usedefaultpath']==1)?true:false);
  	$('#enableloggingcheck')[0].checked = ((appConf['enableloggincheck']==1)?true:false);
  	$('input[name="log_path"]').val(appConf['log_path']);
  	$('input[name="triggerword1"]').val(appConf['triggerword1']);
  	$('input[name="triggerword2"]').val(appConf['triggerword2']);
}

function onentriesfilechanged(entries)
{
  	config['entries_conf'] = entries;
  	$('select[name="entry_list"]').empty();
  	$('select[name="entry_list"]').append("<option>Select entry to edit</option>");
  	for(var i = 0 ; i < Object.keys(config.entries_conf).length ; i ++)
  	{
			$('select[name="entry_list"]').append('<option value = "' + Object.keys(config.entries_conf)[i] + '">' +  Object.keys(config.entries_conf)[i] + '</option>');
  	}
}
function loadconfigfile()
{
	$('input[name="loadconfigfile"]').trigger('click');
}

function onconfigfilechanged()
{
	var input = $('input[name="loadconfigfile"]')[0];
	if(input.files && input.files[0])
	{
		var reader = new FileReader();
		reader.onload = function(e)
		{
			var configStr = e.target.result;
			try{
				var configJSON = JSON.parse(configStr);
				var entries = configJSON.entries_conf;
				var appsettings = configJSON.arcapp_conf;
				onentriesfilechanged(entries);
				onappconfigfilechanged(appsettings);
			}
			catch(err)
			{

			}
		}
		reader.readAsText(input.files[0]);
	}
}
function saveEntry()
{
	if(!currentAppName)
		return showDanger("Please select or add entry to save");
	var groupTitle = $('input[name="group_title"]').val();
	if(!groupTitle)
		return showWarningModal("Please fill group title field");
	var isopenvs = $('#openvscheck')[0].checked;
	var isclosevs = $('#closevscheck')[0].checked;
	var openvs = $('input[name="openvscmd"]').val();
	if(!openvs)
		return showWarningModal("Please fill open voice command field");
	var closevs = $('input[name="closevscmd"]').val();
	if(!closevs)
		return showWarningModal("Please fill close voice command field");

	config.entries_conf[currentAppName].entry_name = groupTitle;
	config.entries_conf[currentAppName].is_openvs = isopenvs;
	config.entries_conf[currentAppName].is_closevs = isclosevs;
	config.entries_conf[currentAppName].openvscmd = openvs;
	config.entries_conf[currentAppName].closevscmd = closevs;
}

function addTcpUdp()
{
	if(!currentAppName)
		return showDanger('Please select entry first');
	setTcpUdpModalProperty(null , -1);
	$("#tcpudpmodal").modal();
}
function saveTcpUdp()
{
	var cmdTitle = $('input[name="tcpudp_title"]').val();
	if(!cmdTitle)
		return showWarningModal("Please fill command title field");
	var isTcp = $('#tcpudp_tcpradio')[0].checked;
	var ip = $('input[name="tcpudp_ip"]').val();
	if(!ip)
		return showWarningModal("Please fill ip field");
	var port = $('input[name="tcpudp_port"]').val();
	if(port <= 0)
		return showWarningModal("Please fill port field");
	var hex = $('input[name="tcpudp_hex').val();
	if(!hex)
		return showWarningModal("Please fill hex field");
	var when = 0;
	var atClose = $('#tcpudp_close_check')[0].checked;
	var atOpen = $('#tcpudp_open_check')[0].checked;
	if(atClose && atOpen)
		when = 3;
	else if(atClose && !atOpen)
		when = 2;
	else if(atOpen && !atClose)
		when = 1;

	var nicip = $('input[name="tcpudp_nic"]').val();
	if(!nicip)
		return showWarningModal("Please fill nic field");
	var vsenabled = $('#tcpudp_vsenable_check')[0].checked;
	var vscmd = $('input[name="tcpudp_vscmd"]').val();
	if(!vscmd)
		return showWarningModal("Please fill vs command field");

	var tcpudpCmd = {
		vsenabled : vsenabled,
		commandwords : vscmd,
		type : 1,
		title : cmdTitle,
		isTcp : isTcp,
		ip : ip,
		port : port,
		executionWhen : when,
		nicip : nicip,
		code : hex//it should be considered when converting json to ini
	};

	var index = $('#tcpudpmodal')[0].dataset['edit'];
	if(index < 0)
		config.entries_conf[currentAppName].commands_list.push(tcpudpCmd);
	else
		config.entries_conf[currentAppName].commands_list[index] = tcpudpCmd;

	//command title for display
	cmdTitle += "(TCP/UDP)";

	//make a row in table
	if(index < 0)
	{
		appendCommandList(cmdTitle);
	}
	else
	{
		$('#commands_list tr:nth-child(' + (parseInt(index) + 1) + ') td:first-child').text(cmdTitle);
	}
	//hide modal
	$('#tcpudpmodal').modal('hide');

}
function appendCommandList(title)
{
	$('#commands_list').append('<tr>' + 
									'<td>' + title +
									'</td>' + 
									'<td>' + 
										'<button class = "btn-secondary btn btn-sm" onclick = "removeCmd(this)">Del</button>' + 
									'</td>' + 
									'<td>' + 
										'<button class = "btn-secondary btn btn-sm" onclick = "editCmd(this)">Edit</button>' + 
									'</td>' + 
								'</tr>');
}

function addBatchFile()
{
	if(!currentAppName)
		return showDanger('Please select entry first');
	setBatchfileModalProperty(null , -1);
	$("#batchfilemodal").modal();
}
function saveBatchFile()
{
	var cmdTitle = $('input[name="batchfile_title"]').val();
	if(!cmdTitle)
		return showWarningModal("Please fill title field");
	var filePath = $('input[name="batchfile_file_path"]').val();
	if(!filePath)
		return showWarningModal("Please fill file path field");
	var when = 0;
	var atClose = $('#batchfile_close_check')[0].checked;
	var atOpen = $('#batchfile_open_check')[0].checked;
	if(atClose && atOpen)
		when = 3;
	else if(atClose && !atOpen)
		when = 2;
	else if(atOpen && !atClose)
		when = 1;
	var vsenabled = $('#batchfile_vsenable_check')[0].checked;
	var vscmd = $('input[name="batchfile_vscmd"]').val();
	if(!vscmd)
		return showWarningModal("Please fill vs command field");

	var batchfileCmd = {
		vsenabled : vsenabled,
		commandwords : vscmd,
		type : 4,
		title : cmdTitle,
		location : filePath,
		executionWhen : when,
		vsenabled : vsenabled,
		commandwords : vscmd
	};


	var index = $('#batchfilemodal')[0].dataset['edit'];
	if(index < 0)
		config.entries_conf[currentAppName].commands_list.push(batchfileCmd);
	else
		config.entries_conf[currentAppName].commands_list[index] = batchfileCmd;

	//command title for display
	cmdTitle += "(BatchFile)";

	//make a row in table
	if(index < 0)
	{
		appendCommandList(cmdTitle);
	}
	else
	{
		$('#commands_list tr:nth-child(' + (parseInt(index) + 1) + ') td:first-child').text(cmdTitle);
	}
	//hide modal
	$('#batchfilemodal').modal('hide');


}
function addHttpTrigger()
{
	if(!currentAppName)
		return showDanger('Please select entry first');
	setHttpTriggerModalProperty(null , -1);
	$("#httptriggermodal").modal();
}
function saveHttpTrigger()
{
	var cmdTitle = $('input[name="httptrigger_title"]').val();
	if(!cmdTitle)
		return showWarningModal("Please fill title field");
	var url = $('input[name="httptrigger_url"]').val();
	if(!url)
		return showWarningModal("Please fill url field");
	var when = 0;
	var atClose = $('#httptrigger_close_check')[0].checked;
	var atOpen = $('#httptrigger_open_check')[0].checked;
	if(atClose && atOpen)
		when = 3;
	else if(atClose && !atOpen)
		when = 2;
	else if(atOpen && !atClose)
		when = 1;
	var vsenabled = $('#httptrigger_vsenable_check')[0].checked;
	var vscmd = $('input[name="httptrigger_vscmd"]').val();
	if(!vscmd)
		return showWarningModal("Please fill vs command field");

	var httptriggerCmd = {
		title : cmdTitle,
		url : url,
		executionWhen : when,
		type : 3,
		vsenabled : vsenabled,
		commandwords : vscmd
	};

	var index = $('#httptriggermodal')[0].dataset['edit'];
	if(index < 0)
		config.entries_conf[currentAppName].commands_list.push(httptriggerCmd);
	else
		config.entries_conf[currentAppName].commands_list[index] = httptriggerCmd;

	//command title for display
	cmdTitle += "(HttpTrigger)";

	//make a row in table
	if(index < 0)
	{
		appendCommandList(cmdTitle);
	}
	else
	{
		$('#commands_list tr:nth-child(' + (parseInt(index) + 1) + ') td:first-child').text(cmdTitle);
	}
	//hide modal
	$('#httptriggermodal').modal('hide');

}
function addDelay()
{
	if(!currentAppName)
		return showDanger('Please select entry first');
	setDelayModalProperty(null , -1);
	$("#delaymodal").modal();
}
function saveDelay()
{
	var cmdTitle = $('input[name="delay_title"]').val();
	if(!cmdTitle)
		return showWarningModal("Please fill title field");
	var delay = $('input[name="delay_time"]').val();
	if(delay < 0 || delay.length == 0)
		return showWarningModal("Please fill delay time field");
	var when = 0;
	var atClose = $('#delay_close_check')[0].checked;
	var atOpen = $('#delay_open_check')[0].checked;
	if(atClose && atOpen)
		when = 3;
	else if(atClose && !atOpen)
		when = 2;
	else if(atOpen && !atClose)
		when = 1;

	var delayCmd = {
		title : cmdTitle,
		timemsec : delay,
		executionWhen : when,
		type : 5,
	};

	var index = $('#delaymodal')[0].dataset['edit'];
	if(index < 0)
		config.entries_conf[currentAppName].commands_list.push(delayCmd);
	else
		config.entries_conf[currentAppName].commands_list[index] = delayCmd;

	//command title for display
	cmdTitle += "(Delay)";

	//make a row in table
	if(index < 0)
	{
		appendCommandList(cmdTitle);
	}
	else
	{
		$('#commands_list tr:nth-child(' + (parseInt(index) + 1) + ') td:first-child').text(cmdTitle);
	}
	//hide modal
	$('#delaymodal').modal('hide');
}
function addHeartbeat()
{
	if(!currentAppName)
		return showDanger('Please select entry first');
	setHeartbeatModalProperty(null , -1);
	$("#heartbeatmodal").modal();
}
function saveHeartbeat()
{
	var cmdTitle = $('input[name="heartbeat_title"]').val();
	if(!cmdTitle)
		return showWarningModal("Please fill command title field");
	var isTcp = $('#heartbeat_tcpradio')[0].checked;
	var ip = $('input[name="heartbeat_ip"]').val();
	if(!ip)
		return showWarningModal("Please fill ip field");
	var port = $('input[name="heartbeat_port"]').val();
	if(port <= 0 || port.length == 0)
		return showWarningModal("Please fill port field");
	var hex = $('input[name="heartbeat_hex').val();
	if(!hex)
		return showWarningModal("Please fill hex field");
	var interval = $('input[name="heartbeat_interval"]').val();
	if(interval < 0 || interval.length == 0)
		return showWarningModal("Please fill interval field");
	var when = 0;
	var atClose = $('#heartbeat_close_check')[0].checked;
	var atOpen = $('#heartbeat_open_check')[0].checked;
	if(atClose && atOpen)
		when = 3;
	else if(atClose && !atOpen)
		when = 2;
	else if(atOpen && !atClose)
		when = 1;

	var nicip = $('input[name="heartbeat_nic"]').val();
	if(!nicip)
		return showWarningModal("Please fill nic field");
	

	var hearbeatCmd = {
		type : 2,
		title : cmdTitle,
		timemsec : interval,
		isTcp : isTcp,
		ip : ip,
		port : port,
		executionWhen : when,
		nicip : nicip,
		code : hex//it should be considered when converting json to ini
	};

	var index = $('#heartbeatmodal')[0].dataset['edit'];
	if(index < 0)
		config.entries_conf[currentAppName].commands_list.push(hearbeatCmd);
	else
		config.entries_conf[currentAppName].commands_list[index] = hearbeatCmd;

	//command title for display
	cmdTitle += "(Heartbeat)";

	//make a row in table
	if(index < 0)
	{
		appendCommandList(cmdTitle);
	}
	else
	{
		$('#commands_list tr:nth-child(' + (parseInt(index) + 1) + ') td:first-child').text(cmdTitle);
	}
	//hide modal
	$('#heartbeatmodal').modal('hide');
}
var currentAppName = "";
function entrySelected()
{
	var selected_app_name = $('select[name="entry_list"]').val();
	console.log(selected_app_name);
	currentAppName = selected_app_name;
	setInitialValue(selected_app_name);
}

function setInitialValue(app_name)
{
	var appEntry = config.entries_conf[app_name];
	if(appEntry == undefined)
		appEntry = {}; 
	//formatting all UI
	$('input[name="group_title"]').val((appEntry['entry_name']==undefined)?"":appEntry['entry_name']);
	
	$('#openvscheck')[0].checked = ((appEntry['is_openvs']==undefined)?false:appEntry['is_openvs']);
	
	$('#closevscheck')[0].checked = ((appEntry['is_closevs']==undefined)?false:appEntry['is_closevs']);
	
	$('input[name="openvscmd"]').val((appEntry['openvscmd']==undefined)?"":appEntry['openvscmd']);

	$('input[name="closevscmd"]').val((appEntry['closevscmd']==undefined)?"":appEntry['closevscmd']);

	//commands list init
	$('#commands_list').empty();
	
	if(appEntry['commands_list'] != undefined)
	{
		for(var i = 0 ; i < appEntry['commands_list'].length ; i ++)
		{
			var type = appEntry['commands_list'][i]['type'];
			var suffix = "";
			switch(type)
			{
				case 1:
					suffix = "(TCP/UDP)";
					break;
				case 2:
					suffix = "(Heartbeat)";
					break;
				case 3:
					suffix = "(HttpTrigger)";
					break;
				case 4:
					suffix = "(BatchFile)"	;
					break;
				case 5:
					suffix = "(Delay)";
					break;
				default : 
					break;
			}
			appendCommandList(((appEntry['commands_list'][i]['title']==undefined)?"":appEntry['commands_list'][i]['title'] + suffix));
		}
	}
}

function addNewEntry()
{
	var app_name = $('input[name="app_name"]').val();
	if(app_name.length == 0)
		return showDanger("App name can not be empty");
	if(config.entries_conf[app_name] != undefined)
		return showDanger("The app name is already in the entry list");

	config.entries_conf[app_name] = {};
	config.entries_conf[app_name].commands_list = [];

	$('select[name="entry_list"]').append('<option value = "' + app_name + '">' + app_name + '</option>');
	$('select[name="entry_list"]').val(app_name).trigger('change');
	// //formatting all UI
	// $('input[name="group_title"]').val("");
	// $('#openvscheck')[0].checked = false;
	// $('#closevscheck')[0].checked = false;
	// $('input[name="openvscmd"]').val("");
	// $('input[name="closevscmd"]').val("");
	// $('#commands_list').empty();
}

function removeCurrentEntry()
{
	if(!currentAppName)
		return;
	$('select[name="entry_list"] option[value="' + currentAppName + '"]').remove();
	config.entries_conf[currentAppName] = undefined;
	currentAppName = "";
}

function removeCmd(element)
{
	//we should get index of row in table
	console.log(element.parentNode.parentNode.rowIndex);
	var rowIndex = element.parentNode.parentNode.rowIndex;//based on 1 as first member
	$("#commands_list tr:nth-child(" + (rowIndex) + ")").remove();
	config.entries_conf[currentAppName].commands_list.splice(rowIndex - 1 , 1);
}

function editCmd(element)
{
	//we should get index of row in table
	console.log(element.parentNode.parentNode.rowIndex);
	var rowIndex = element.parentNode.parentNode.rowIndex;//based on 1 as first member
	showCmdWindow(rowIndex);
}

//rowIndex is based on 1 as first member
function showCmdWindow(rowIndex)
{
	var cmdObj = config.entries_conf[currentAppName].commands_list[rowIndex - 1];
	if(!cmdObj)
		return;
	var type = cmdObj.type;
	switch(type)
	{
	case 1:
		setTcpUdpModalProperty(cmdObj , rowIndex - 1);
		$('#tcpudpmodal').modal();
		break;
	case 2:	
		setHeartbeatModalProperty(cmdObj , rowIndex - 1);
		$('#heartbeatmodal').modal();
		break;
	case 3:
		setHttpTriggerModalProperty(cmdObj , rowIndex - 1);
		$('#httptriggermodal').modal();
		break;
	case 4:
		setBatchfileModalProperty(cmdObj , rowIndex - 1);
		$('#batchfilemodal').modal();
		break;
	case 5:
		setDelayModalProperty(cmdObj , rowIndex - 1);
		$('#delaymodal').modal();
		break;
	default:
		break;
	}
}
function setTcpUdpModalProperty(obj , index)
{
	if(!obj)
		obj = {};
	$('input[name="tcpudp_title"]').val((obj.title!=undefined)?(obj.title):(""));
	if(obj.isTcp == undefined)
		$('#tcpudp_tcpradio')[0].checked = true;
	else if(obj.isTcp == true)
		$('#tcpudp_tcpradio')[0].checked = true;
	else
		$('#tcpudp_udpradio')[0].checked = true;
	$('input[name="tcpudp_ip"]').val(((obj.ip!=undefined)?(obj.ip):("")));
	$('input[name="tcpudp_port"]').val(((obj.port!=undefined)?(obj.port):("")));
	$('input[name="tcpudp_hex"]').val(((obj.code!=undefined)?(obj.code):("")));
	if(obj.executionWhen == undefined)
		obj.executionWhen = 0;
	switch(obj.executionWhen)
	{
		case 0:
		$('#tcpudp_close_check')[0].checked = false;
		$('#tcpudp_open_check')[0].checked = false;
		break;
		case 1:
		$('#tcpudp_close_check')[0].checked = false;
		$('#tcpudp_open_check')[0].checked = true;
		break;
		case 2:
		$('#tcpudp_close_check')[0].checked = true;
		$('#tcpudp_open_check')[0].checked = false;
		break;
		case 3:
		$('#tcpudp_close_check')[0].checked = true;
		$('#tcpudp_open_check')[0].checked = true;
		break;
		default:
		break;
	}
	$('input[name="tcpudp_nic"]').val(((obj.nicip!=undefined)?(obj.nicip):""));
	$('#tcpudp_vsenable_check')[0].checked = false;
	if(obj.vsenabled!=undefined)
		$('#tcpudp_vsenable_check')[0].checked = obj.vsenabled;
	$('input[name="tcpudp_vscmd"]').val(((obj.commandwords!=undefined)?(obj.commandwords):("")));
	$('#tcpudpmodal')[0].dataset['edit'] = index;
}
function setBatchfileModalProperty(obj , index)
{
	if(!obj)
		obj = {};
	$('#batchfilemodal')[0].dataset['edit'] = index;
	$('input[name="batchfile_title"]').val(((obj.title!=undefined)?(obj.title):("")));
	$('input[name="batchfile_file_path"]').val(((obj.location!=undefined)?(obj.location):("")));
	if(obj.executionWhen == undefined)
		obj.executionWhen = 0;
	switch(obj.executionWhen)
	{
		case 0:
		$('#batchfile_close_check')[0].checked = false;
		$('#batchfile_open_check')[0].checked = false;
		break;
		case 1:
		$('#batchfile_close_check')[0].checked = false;
		$('#batchfile_open_check')[0].checked = true;
		break;
		case 2:
		$('#batchfile_close_check')[0].checked = true;
		$('#batchfile_open_check')[0].checked = false;
		break;
		case 3:
		$('#batchfile_close_check')[0].checked = true;
		$('#batchfile_open_check')[0].checked = true;
		break;
		default:
		break;
	}
	$('#batchfile_vsenable_check')[0].checked = false;
	if(obj.vsenabled!=undefined)
		$('#batchfile_vsenable_check')[0].checked = obj.vsenabled;
	$('input[name="batchfile_vscmd"]').val(((obj.commandwords!=undefined)?(obj.commandwords):("")));
}
function setHttpTriggerModalProperty(obj , index)
{
	if(!obj)
		obj = {};
	$('#httptriggermodal')[0].dataset['edit'] = index;
	$('input[name="httptrigger_title"]').val(((obj.title!=undefined)?(obj.title):("")));
	$('input[name="httptrigger_url"]').val(((obj.url!=undefined)?(obj.url):("")));
	if(obj.executionWhen == undefined)
		obj.executionWhen = 0;
	switch(obj.executionWhen)
	{
		case 0:
		$('#httptrigger_close_check')[0].checked = false;
		$('#httptrigger_open_check')[0].checked = false;
		break;
		case 1:
		$('#httptrigger_close_check')[0].checked = false;
		$('#httptrigger_open_check')[0].checked = true;
		break;
		case 2:
		$('#httptrigger_close_check')[0].checked = true;
		$('#httptrigger_open_check')[0].checked = false;
		break;
		case 3:
		$('#httptrigger_close_check')[0].checked = true;
		$('#httptrigger_open_check')[0].checked = true;
		break;
		default:
		break;
	}
	$('#httptrigger_vsenable_check')[0].checked = false;
	if(obj.vsenabled!=undefined)
		$('#httptrigger_vsenable_check')[0].checked = obj.vsenabled;
	$('input[name="httptrigger_vscmd"]').val(((obj.commandwords!=undefined)?(obj.commandwords):("")));

}
function setDelayModalProperty(obj , index)
{
	if(!obj)
		obj = {};
	$('#delaymodal')[0].dataset['edit'] = index;
	$('input[name="delay_title"]').val(((obj.title!=undefined)?(obj.title):("")));
	if(obj.executionWhen == undefined)
		obj.executionWhen = 0;
	switch(obj.executionWhen)
	{
		case 0:
		$('#delay_close_check')[0].checked = false;
		$('#delay_open_check')[0].checked = false;
		break;
		case 1:
		$('#delay_close_check')[0].checked = false;
		$('#delay_open_check')[0].checked = true;
		break;
		case 2:
		$('#delay_close_check')[0].checked = true;
		$('#delay_open_check')[0].checked = false;
		break;
		case 3:
		$('#delay_close_check')[0].checked = true;
		$('#delay_open_check')[0].checked = true;
		break;
		default:
		break;
	}
	$('input[name="delay_time"]').val(((obj.title!=undefined)?(obj.timemsec):("")));
}
function setHeartbeatModalProperty(obj , index)
{
	if(!obj)
		obj = {};
	$('input[name="heartbeat_title"]').val((obj.title!=undefined)?(obj.title):(""));
	if(obj.isTcp == undefined)
		$('#heartbeat_tcpradio')[0].checked = true;
	else if(obj.isTcp == true)
		$('#heartbeat_tcpradio')[0].checked = true;
	else
		$('#heartbeat_udpradio')[0].checked = true;

	$('input[name="heartbeat_ip"]').val(((obj.ip!=undefined)?(obj.ip):("")));
	$('input[name="heartbeat_port"]').val(((obj.port!=undefined)?(obj.port):("")));
	$('input[name="heartbeat_hex"]').val(((obj.code!=undefined)?(obj.code):("")));
	if(obj.executionWhen == undefined)
		obj.executionWhen = 0;
	switch(obj.executionWhen)
	{
		case 0:
		$('#heartbeat_close_check')[0].checked = false;
		$('#heartbeat_open_check')[0].checked = false;
		break;
		case 1:
		$('#heartbeat_close_check')[0].checked = false;
		$('#heartbeat_open_check')[0].checked = true;
		break;
		case 2:
		$('#heartbeat_close_check')[0].checked = true;
		$('#heartbeat_open_check')[0].checked = false;
		break;
		case 3:
		$('#heartbeat_close_check')[0].checked = true;
		$('#heartbeat_open_check')[0].checked = true;
		break;
		default:
		break;
	}
	$('input[name="heartbeat_interval"]').val(((obj.timemsec!=undefined)?(obj.timemsec):""));
	$('input[name="heartbeat_nic"]').val(((obj.nicip!=undefined)?(obj.nicip):""));
	$('#heartbeatmodal')[0].dataset['edit'] = index;
}
/* config page end */

/* profile page begin */
function createCompany()
{
	var companyname = $('input[name="companyname"]').val();
	var companydesc = $('textarea[name="companydesc"]').val();
	if(!companyname || !companydesc)
		return showDanger("Please fill in the form");
	$.ajax({
		url : '/user-profile/me/create-company',
		type : "POST",
		data : {
			companyname : companyname,
			companydesc : companydesc
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				location.href = "/admin";
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	})
}
function openUserPhoto()
{
	$('input[name="photo"]').trigger('click');
}
function userPhotoChanged()
{
	var input = $('input[name="photo"]')[0];
	if (input.files && input.files[0]) 
	{
	    var reader = new FileReader();

	    reader.onload = function(e){
	      $('#profile_form img.user-img').attr('src', e.target.result);
	    }

	    reader.readAsDataURL(input.files[0]);
  	}
}
function saveProfileChanges()
{
	var email = $('input[name="email"]').val();
	if(!checkEmail(email))
	{
		return showDanger("Please use valid email");
	}
	var username = $('input[name="username"]').val();
	if(username.length == 0)
		return showDanger("Username can not be empty");
	let userData = (new FormData($('#profile_form')[0]));
	var userid = $('input[name="userid"]').val();
	var url = "/user-profile/me/save-changes";
	var method = "POST";

	$.ajax({
		url : url,
		type : method,
		data : userData,
        cache: false,
        contentType: false,
        enctype: 'multipart/form-data',
        processData: false,
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				showSuccess("Successfully updated");
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	});
}
function changeLoginMethod()
{
	if($('#usedmanuallogincheck')[0].checked == true)
	{
		$('input[name="oldpassword"]').attr({disabled : false});
	}
	else
	{
		$('input[name="oldpassword"]').attr({disabled : true});
	}
}
function changePassword()
{
	var oldpassword = $('input[name="oldpassword"]').val();
	var newpassword = $('input[name="newpassword"]').val();
	var confirmpassword = $('input[name="confirmpassword"]').val();
	var shouldenc = (($('#usedmanuallogincheck')[0].checked)?(1):(0));
	if(newpassword != confirmpassword)
		return showDanger("New password and confirm password do not match");
	if(!checkPassword(newpassword))
		return showDanger("Please use strong password");
	$.ajax({
		url : "/user-profile/password/change-password",
		type : "POST",
		data :{
			oldpassword : oldpassword,
			newpassword : newpassword,
			shouldenc : shouldenc
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				showSuccess("Successfully changed");
				$('input[name="oldpassword"]').val("");
				$('input[name="newpassword"]').val("");
				$('input[name="confirmpassword"]').val("");
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	})
}
// upload ini file from local machine
function uploadIniFile()
{
	$('input[name="inifile"]').trigger('click');
}
function oninifilechanged()
{
	var input = $('input[name="inifile"]')[0];
	if (input.files && input.files[0] ) 
	{
		var filenames = input.files[0].name.split(".");
		var extension = filenames[filenames.length - 1];
		if(extension == "ini")
		{
			var reader = new FileReader();

		    reader.onload = function(e){
		      $('textarea[name="content"]').val($('textarea[name="content"]').val() + e.target.result);
		    }

		    reader.readAsText(input.files[0]);
		}
		else
		{
			showDanger("The file format is not ini");
		}
  	}
}
// upload ini file from local machine

function rejectInvite(inviteid)
{
	$.ajax({
		url : "/user-profile/invite/reject",
		data : {
			inviteid : inviteid
		},
		type : "POST",
		success : function(response)
		{
			if(response.status == 'SUCCESS')
			{
				$('#invite' + inviteid).remove();
			}	
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}	
	});
}	
function acceptInvite(inviteid)
{
	$.ajax({
		url : "/user-profile/invite/accept",
		data : {
			inviteid : inviteid
		},
		type : "POST",
		success : function(response)
		{
			if(response.status == 'SUCCESS')
			{
				$('#invite' + inviteid).remove();
			}	
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}	
	});
}

function makePrivateThread(threadid)
{
	var isprivate = (($('#privatecheck' +  threadid)[0].checked)?1:0);
	$.ajax({
		url : "/user-profile/thread/makeprivate",
		type : "POST",
		data : {
			isprivate : isprivate,
			threadid : threadid
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{

			}
			else
			{
				$('#privatecheck' + threadid)[0].checked = !($('#privatecheck' + threadid)[0].checked);
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			$('#privatecheck' + threadid)[0].checked = !($('#privatecheck' + threadid)[0].checked);
			showDanger(err.statusText + " : " + err.status);
		}
	});

}
function closeThread(threadid)
{
	$.ajax({
		url : "/user-profile/thread/close",
		type : "POST",
		data : {
			threadid : threadid
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				$('#closeThreadBtn' + threadid).attr({disabled : true});
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	});
}
/* profile page end */

/* admin page begin */
function saveCompanyProfile()
{
	var companyname = $('input[name="companyname"]').val();
	var companydesc = $('textarea[name="companydesc"]').val();
	if(!companyname || !companydesc)
		return showDanger("Fill in the form");
	$.ajax({
		url : "/admin/company/change-company-profile",
		type : "POST",
		data : {
			companyname : companyname,
			companydesc : companydesc
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				showSuccess("Successfully changed");
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	})
}
function changePermission(userid)
{
	var checked = $('#isprivatecheck' + userid)[0].checked;
	if(checked)
		privatemember = 1;
	else
		privatemember = 0;
	$.ajax({
		url : '/admin/members/change-user-permission',
		type : 'POST',
		data : {
			privatemember : privatemember,
			userid : userid,
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				// showSuccess("Successfully changed");
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	});
}
function removeMember(userid)
{
	$("#confirmdlg button.btn-primary")[0].dataset["userid"] = userid;
	
	$("#confirmdlg").modal();
}
function sureRemove()
{
	var userid = $("#confirmdlg button.btn-primary")[0].dataset["userid"];
	$.ajax({
		url : '/admin/members/remove-member',
		type : 'POST',
		data : {
			userid : userid,
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				showSuccess("Successfully removed");
				$('#user' + userid).remove();
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	});
}
function inviteMember(useremail , userid)
{
	if(!useremail)
		return showDanger("No user selected");
	$.ajax({
		url : "/admin/members/invite",
		type : "POST",
		data : {
			useremail : useremail
		},
		success : function(response)
		{
			if(response.status == "SUCCESS")
			{
				showSuccess("Successfully invited");
				$('#user' + userid + ' td button').remove();
				$('#user' + userid + ' td:last-child').append('<span class = "text-success">Invited</span>');
			}
			else
			{
				showDanger(response.msg);
			}
		},
		error : function(err)
		{
			showDanger(err.statusText + " : " + err.status);
		}
	})
}
/* admin page end */
