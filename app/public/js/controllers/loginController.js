
function LoginController()
{

// bind event listeners to button clicks //

	$('#login-form #forgot-password').click(function(){
        forgotDialog(0);

    });
	
// automatically toggle focus between the email modal window and the login form //

    $('#get-credentials').on('shown', function(){ $('#email-tf').focus(); });
	//$('#get-credentials').on('hidden', function(){ $('#user-tf').focus(); });

}

function forgotDialog(arg){
    var forgot;
    if(arg==1)
    {
        forgot = '<div class="row"> ' +
            '<div class="col-md-12"> ' +
            '<form class="form-horizontal"> ' +
            '<div class="form-group"> ' +
            '<label class="col-md-6 control-label" for="name">Email:</label> ' +
            '<div class="col-md-6"> ' +
            '<input id="fp" name="fp" type="text" placeholder="Enter Email Id" class="form-control input-md"> ' +
            '</div> ' +
            '</div>' +
            '</form>' +
            '<label class="col-md-6 control-label" for="name" style="color: red">Please Enter valid email id</label> </div> </div>'
    }
    else {
        forgot = '<div class="row"> ' +
            '<div class="col-md-12"> ' +
            '<form class="form-horizontal"> ' +
            '<div class="form-group"> ' +
            '<label class="col-md-6 control-label" for="name">Email:</label> ' +
            '<div class="col-md-6"> ' +
            '<input id="fp" name="fp" type="text" placeholder="Enter Email Id" class="form-control input-md"> ' +
            '</div> ' +
            '</div>' +
            '</form>' +
            '</div> </div>'
    }
    bootbox.dialog({
            title: "Retrieve your Password",
            message: forgot,
            buttons: {
                success: {
                    label: "Submit",
                    className: "btn-primary",
                    callback: function () {
                        var email = document.getElementById("fp").value;
                        var ev = new EmailValidator();
                        if(ev.validateEmail(document.getElementById("fp").value))
                        {
                            console.log("right");


                            $.ajax({
                                url : server+"/lost-password",
                                type: "POST",
                                data : {'email':email},
                                success: function(data, textStatus, jqXHR)
                                {
                                    //data - response from server
                                    console.log([data,textStatus,jqXHR]);
                                    if (textStatus == 'success') {
                                        bootbox.hideAll();
                                        bootbox.alert("Check your inbox for further instructions", function() {  });

                                    }
                                },
                                error: function (jqXHR, textStatus, errorThrown)
                                {

                                    if(jqXHR.responseText=='email-server-error') {
                                        bootbox.hideAll();
                                        bootbox.alert("Network error, try again later", function () {

                                        });
                                    }
                                    else{
                                        bootbox.hideAll();
                                        bootbox.alert("User not found try other email id or register", function () {

                                        });
                                    }
                                }
                            });

                        }
                        else
                        {
                            bootbox.hideAll();
                            forgotDialog(1);

                        }

                    }
                }
            }
        }
    );
}