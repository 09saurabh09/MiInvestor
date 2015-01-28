
function LoginValidator(){

// bind a simple alert window to this controller to display any errors //

	this.loginErrors = $('.modal-alert');
	this.loginErrors.modal({ show : false, keyboard : true, backdrop : true });

	this.showLoginError = function(t, m)
	{
		$('.modal-alert .modal-header h3').text(t);
		$('.modal-alert .modal-body p').text(m);
		this.loginErrors.modal('show');
	}

}

LoginValidator.prototype.validateForm = function()
{
	if ($('#user-tf').val() == ''){
        bootbox.hideAll();
        //bootbox.alert("Whoops!', 'Please enter a valid username", function() {  });
        bootbox.dialog({
            message: "Please enter a valid username",
            title: "WWhoops!",
            buttons: {
                success: {
                    label: "OK!",
                    className: "btn-success",
                    callback: function() {

                    }
                }

            }
        });
		this.showLoginError('Whoops!', 'Please enter a valid username');
		return false;
	}	else if ($('#pass-tf').val() == ''){
        bootbox.hideAll();
        //bootbox.alert("WWhoops!', 'Please enter a valid password", function() {  });
        bootbox.dialog({
            message: "Please enter a valid password",
            title: "WWhoops!",
            buttons: {
                success: {
                    label: "OK!",
                    className: "btn-success",
                    callback: function() {

                    }
                }

            }
        });
		this.showLoginError('Whoops!', 'Please enter a valid password');
		return false;
	}	else{
		return true;
	}
}