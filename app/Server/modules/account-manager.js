var crypto 		= require('crypto');
var moment 		= require('moment');
var connection  = require('./connection');

var request = connection.request;
var db = 'MiInvestor';
var initialcash  = 1000000;
/* login validation methods */
exports.autoLogin = function(user, pass, callback)
{
    request.query('SELECT Username, Pass,Cash,SharesWorth FROM '+db+'.global.UserDetails where Username = '+'\''+user+'\'', function(e, o) {

		if (o.length>0){
			o[0]['Pass'] == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
}

exports.manualLogin = function(user, pass, callback)
{
	request.query('SELECT * FROM '+db+'.global.UserDetails where Username = '+'\''+user+'\'', function(e, o) {
		if ((o == null)||(o==undefined)||(o=='undefined')||(o=='')){
			callback('user-not-found');
		}	else{

			validatePassword(pass,o[0]['Pass'], function(err, res) {

				if (res){
					callback(null, o);
				}	else{
					callback('invalid-password');
				}
			});
		}
	});
}

/* record insertion, update & deletion methods */

exports.addNewAccount = function(newData, callback)
{   var initialStocks = {
                         'goog':0,'msft':0,'fb':0,'aapl':0,'adbe':0,'amzn':0,
                         'bidu':0,'csco':0,'ebay':0,'foxa':0,'intc':0,'nflx':0,
                         'ntap':0,'nvda':0,'qcom':0,'sbux':0,'txn':0,'yhoo':0,
                         'vod':0,'atvi':0
                        };
    var sd = JSON.stringify(initialStocks);
    request.query('SELECT COUNT(*) as count FROM '+db+'.global.UserDetails where Username = '+'\''+newData.user.toLowerCase()+'\'', function(e, o) {
        if ((o[0]['count']>0)){

			callback('username-taken');
		}	else{
			request.query('SELECT COUNT(*) as count FROM '+db+'.global.UserDetails where EmailId =' +'\''+newData.email.toLowerCase()+'\'', function(e, o) {
				if (o[0]['count']>0){

					callback('email-taken');
				}	else{
					saltAndHash(newData.pass, function(hash){

						newData.pass = hash;
                        var zero =0;
					// append date stamp when record was created //
						newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
                        var watchlist = {};
                        watchlist = JSON.stringify(watchlist);
						//accounts.insert(newData, {safe: true}, callback);
                        var ins_query = 'INSERT INTO '+db+'.global.UserDetails ([Name],[EmailId] ,[Username],[Pass],[Cash],StockDetails,SharesWorth, [Country])'+
                        'VALUES'+'(\''+newData.name+'\',\''+newData.email.toLowerCase()+'\',\''+newData.user.toLowerCase()+'\',\''+hash+'\',\''+initialcash+'\',\''+sd+'\',\''+zero+'\',\''+newData.country+'\')';
                        // For adding new entry in user table
                        request.query(ins_query,function(e,o){
                            if(e){
                                console.log(e.message);
                                console.log("Entry not added for "+newData.email);
                                e.ec = 1; // For sending personalized error codes
                                callback(e);
                            }
                            else{callback(null);}
                        });

                        var create_query = 'CREATE TABLE '+db+'.local.U'+newData.user+'OrderBook(OrderId varchar(40) NOT NULL Primary Key,'+
                            'CompanyCode varchar(10) NOT NULL,OrderType varchar(10) NOT NULL,PriceType varchar(10) Not NULL,'+
                            'TIF varchar(10) Not NULL,Price decimal(15,5) Not NUll,Qty bigint Not Null,leftover bigint, TriggerPrice decimal(15,5) NUll,'+
                            'StateOfTxn varchar(10) Not NULL,LogTime datetime2(7) Not NULL,TriggerTime dateTime2(7) Null)';

                        // For creating personal table for this user
                        request.query(create_query,function(e,o){
                            if(e){
                                console.log(e.message);
                                console.log("OrderBook Table not created for "+newData.email);
                            }

                        });

                        var stat_query = 'CREATE TABLE '+db+'.local.U'+newData.user+'Stats(EntryDate datetime2 NOT NULL Primary Key,Cash decimal(15,5) Not NUll,'+
                            'SharesWorth decimal(15,5) Not Null,StockDetails Varchar(max) NULL)';

                        // For Having daily stats
                        request.query(stat_query,function(e,o){
                            if(e){
                                console.log(e.message);
                                console.log("Stat Table not created for "+newData.email);
                            }
                            else // Update Stat Table with defaults
                            {
                                var upd_query ='INSERT INTO '+db+'.local.U'+newData.user+'Stats([EntryDate],[Cash],[SharesWorth],[StockDetails])'+
                                'VALUES (SYSDATETIME(),\''+initialcash+'\',0,\''+sd+'\')';
                                request.query(upd_query,function(e,o){
                                    if(e){
                                        console.log(e.message);
                                        console.log("Default values not inserted in stat table");
                                    }
                                });
                            }

                        });

					});
				}
			});
		}
	});
}

exports.updateAccount = function(newData, callback)
{
	accounts.findOne({user:newData.user}, function(e, o){
		o.name 		= newData.name;
		o.email 	= newData.email;
		o.country 	= newData.country;
		if (newData.pass == ''){
			accounts.save(o, {safe: true}, function(err) {
				if (err) callback(err);
				else callback(null, o);
			});
		}	else{
			saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				accounts.save(o, {safe: true}, function(err) {
					if (err) callback(err);
					else callback(null, o);
				});
			});
		}
	});
}

exports.updatePassword = function(email, newPass, callback)
{
	request.query('SELECT Email FROM '+db+'.global.UserDetails where EmailId =' +'\''+email+'\'', function(e, o){
		if (e){
			callback(e, null);
		}	else{
			saltAndHash(newPass, function(hash){
		        //o.pass = hash;
                var Pass_update_query = 'UPDATE '+db+'.global.UserDetails SET [Pass] =\''+hash+'\'  WHERE EmailId =' +'\''+email+'\'';
                request.query(Pass_update_query,callback(null,o));

			});
		}
	});
}

/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
	accounts.remove({_id: getObjectId(id)}, callback);
}

exports.getAccountByEmail = function(email, callback)
{
	request.query('SELECT EmailId,Pass,Username,Name FROM '+db+'.global.UserDetails where EmailId =' +'\''+email+'\'', function(e, o){
        callback(o);
    });
}

exports.validateResetLink = function(email, passHash, callback)
{
	request.query('SELECT EmailId,Pass FROM '+db+'.global.UserDetails where EmailId =' +'\''+email+'\'AND Pass =' +'\''+passHash+'\'', function(e, o){

		callback(o ? 'ok' : null);
	});
}

exports.getAllRecords = function(callback)
{
	accounts.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

exports.delAllRecords = function(callback)
{
	accounts.remove({}, callback); // reset accounts collection for testing //
}

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

/* auxiliary methods */

var getObjectId = function(id)
{
	return accounts.db.bson_serializer.ObjectID.createFromHexString(id)
}

var findById = function(id, callback)
{
	accounts.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};


var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	accounts.find( { $or : a } ).toArray(
		function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}
