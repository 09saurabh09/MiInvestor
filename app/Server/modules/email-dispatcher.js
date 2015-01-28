
var ES = require('./email-settings');
var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect({

	host 	    : ES.host,
	user 	    : ES.user,
	password    : ES.password,
	ssl		    : true,
    port        : 465

});

EM.dispatchResetPasswordLink = function(account, callback)
{
	EM.server.send({
		from         : ES.sender,
		to           : account[0]['Email'],
		subject      : 'Password Reset',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account)
	}, callback );
}

EM.composeEmail = function(o)
{
	var link = '192.168.0.103:8000/reset-password?e='+o[0]['Email']+'&p='+o[0]['Password'];
	var html = "<html><body>";
		html += "Hi "+o[0]['Name']+",<br><br>";
		html += "Your username is :: <b>"+o[0]['Username']+"</b><br><br>";
		html += "<a href='"+link+"'>Please click here to reset your password</a><br><br>";
		html += "Cheers,<br>";
		html += "<a href='home.iitk.ac.in/~saurabhh'>Saurabh </a><br>Software Developer<br>";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}