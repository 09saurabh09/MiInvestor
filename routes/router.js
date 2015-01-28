var express = require('express');
var order = require('../app/Server/modules/order');
var statsProvider = require('../app/Server/modules/StatsProvider');

var router = express.Router();


var CT = require('./../app/Server/modules/country-list');
var AM = require('./../app/Server/modules/account-manager');
var EM = require('./../app/Server/modules/email-dispatcher');

var user_details ={}; // To store user details and pass to homepage
var username = null;
var cash,shareworth;
	router.get('/', function(req, res){

	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
                username = req.cookies.user;
                cash = req.cookies.cash;
                shareworth = req.cookies.shareworth;
                user_details = req.cookies;

				if (o != null){
				    req.session.user = o;
					res.redirect('/home');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	router.post('/', function(req, res){
		AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
			if (!o){
				res.send(e, 400);
			}	else{
			    //req.session.user = o;
                //res.cookie('user', o[0]['UserName'], { maxAge: 900000 });
                //console.log(o[0]['UserName']);
                username = o[0]['UserName'];
                cash = o[0]['Cash'];
                shareworth = o[0]['Sharesworth'];

                //username = req.cookies.user;

                user_details['user'] = o[0]['Username'];

                console.log(user_details);
				if (req.param('remember-me') == 'true'){

					res.cookie('user', o[0]['UserName'], { maxAge: 900000 });

				}
				res.send("OK", 200);
			}
		});
	});
	
// logged-in user homepage //
	
	router.get('/home', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
            username =req.session.user[0].Username;
            cash = req.session.user[0].Cash;
            shareworth = req.session.user[0].SharesWorth;

			res.render('home', {
				title : 'Control Panel',
				countries : CT,
				udata : req.session.user,
                userData:user_details,
                username:username,
                cash:cash,
                shareworth:shareworth
			});

	    }
	});
	
	router.post('/home', function(req, res){
		if (req.param('user') != undefined) {
			AM.updateAccount({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				country 	: req.param('country'),
				pass		: req.param('pass')
			}, function(e, o){
				if (e){
					res.send('error-updating-account', 400);
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.send('ok', 200);
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});
	
// creating new accounts //
	
	router.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup', countries : CT });
	});
	
	router.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.param('name'),
			email 	: req.param('email'),
			user 	: req.param('user'),
			pass	: req.param('pass'),
			country : req.param('country')
		}, function(e){
			if (e){
				res.send(e, 400);
			}	else{
				res.send('ok', 200);
			}
		});
	});

// password reset //

	router.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body.email, function(o){
            console.log(o);
			if (o.length>0){
				//res.send('ok', 200);
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// should add an ajax loader to give user feedback //
					if (!e) {
						res.send('ok', 200);
					}	else{
						res.send('email-server-error', 400);
						for (k in e) console.log('error : ', k, e[k]);
					}
				});
			}	else{
				res.send('email-not-found', 400);

			}
		});
	});

	router.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	router.post('/reset-password', function(req, res) {
		var nPass = req.param('pass');
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.send('ok', 200);
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});


// Place the trade
    router.post('/place_trade', function(req, res) {
        //console.log(req.body);
        //req.body.user = req.session.user[0].UserName;  // To add username in placed trade
        //req.body.user = username;
        var order_det;// Variable to store comp name for which there is possibility of trade
        //Before placing order check current status of user
        if(req.body.user!='admin'){
        order.check_status(req.body,function (e, o) {
            if(e){
                res.status(400).send("Not enough resources");
                console.log(e);
            }
            else{
                // Function for placing trade and to search potential trade
                order.place_trade(req.body, function (e, o) {
                    order_det = o;
                    
                    if (e) {
                        res.status(400).send("Your order cannot be placed");
                        console.log(e.message);
                    }
                    else {
                        if (order_det != undefined)
                        {   // Removed all callbacks inside this function @3:00AM 5th Oct
                            order.trade(order_det,function(){
                                res.status(200).send("OK");
                            });
                        }
                        else {
                            res.status(200).send("OK");
                        }

                    }

                });
            }
        });
        }

        else
        {
            if(req.body.type=='sell'){
            order.place_trade(req.body,function(e,o){


                if (e) {
                    res.status(400).send("Your order cannot be placed");
                    console.log(e.message);
                }
                else {

                        res.status(200).send("OK");

                }
            });
            }
            else {
                res.status(400).send("Admin can not place buy order");
            }
        }

    });
// view & delete accounts //

router.post('/addToWatchList', function(req, res) {
    order.addToWatchlist(req.body,function(e){
        if(e)
        {
            res.status(400).send("Not added to watchlist");
        }
        else
        {
            res.status(200).send("OK");
        }
    });

});

	router.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});
	
	router.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
	            req.session.destroy(function(e){ res.send('ok', 200); });
			}	else{
				res.send('record not found', 400);
			}
	    });
	});
	
	router.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});

    // giving data for bar graph generation
    router.post('/get_bar_data', function(req, res) {
        console.log(req.body);
        statsProvider.fetchGraphData(req.body,function(e,o){
            if(e)
            {

            }
            else
            {
                res.status(200).send(o);
            }

        });
    });

    router.post('/get_company_quotes', function(req, res) {
        console.log(req.body);
        statsProvider.fetchCompanyQuotes(req.body,function(e,o){
            if(e)
            {

            }
            else
            {
                res.status(200).send(o);
            }

        });
    });

	
	router.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });


module.exports = router;