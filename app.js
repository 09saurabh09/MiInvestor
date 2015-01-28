var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser'); // the session is stored in a cookie, so we use this to parse it
var bodyParser = require('body-parser');
var ngrok = require('ngrok');
var cors = require('cors');
//var order = require('./Server/order');

var routes = require('./routes/index');
var users = require('./routes/users');
var rout = require('./routes/router');

var CompPrice = require('./app/Server/modules/CompanyStats');
setInterval(function(){CompPrice.getCompQuotes()},1800000);// periodically fetches data and table
var app = express();

// view engine setup
app.set('views', path.join(__dirname, '/app/server/views'));//Changed from default
app.set('view engine', 'ejs');
app.set('port', 8000);

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/app/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({secret:'super-duper-secret-secret',saveUninitialized: true,resave: true}));
//app.use(express.session({ secret: 'super-duper-secret-secret' }));
app.use(express.static(path.join(__dirname, '/app/public')));

//app.use('/', routes);
//app.use('/users', users);
app.use('/', rout);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.disable('etag');

app.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

ngrok.connect(app.get('port'), function (err, url) {
    console.log(url);
    // https://757c1652.ngrok.com -> 127.0.0.1:8080
});

module.exports = app;
