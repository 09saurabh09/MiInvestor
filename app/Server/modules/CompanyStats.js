/**
 * Created by SAURABH on 10/29/2014.
 */
var sql   = require('mssql');
var requestModule = require('request');
var connection  = require('./connection');

var request = connection.request;
var db = 'MiInvestor';
var statTable = 'global.CompanyStats';

function stockPrice(low, current, high,pchange,change) {
    //this.stocks = {};
    //this.stocks[comp] = {};
    this['low']=low;
    this['current']=current;
    this['high']=high;
    this['pchange']=pchange;
    this['change']=change;

}


var url_yahoo = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%'+
    '20yahoo.finance.quotes%20where%20symbol%20in%20%28%22goog%2Cmsft'+
    '%2Cfb%2CAAPL%2CADBE%2CAMZN%2CBIDU%2CCSCO%2CEBAY%2CFOXA%2CINTC%2CNFLX'+
    '%2CNTAP%2CNVDA%2CQCOM%2CSBUX%2CTXN%2CYHOO%2CVOD%2CATVI%2CDTV %22%29&'+
    'format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2'+
    'Falltableswithkeys&callback='

var url_google = 'http://finance.google.com/finance/info?client=ig&q=NASDAQ%3aMSFT'+
                 ',fb,aapl,adbe,amzn,bidu,csco,ebay,foxa,goog,intc,msft,nflx,ntap'+
                 ',nvda,qcom,sbux,txn,yhoo,vod,atvi';
//setInterval(function(){getCompQuotes()},10000);// periodically fetches data and table

var options = {
    uri: url_google,
    port:80,
    path:'/',
    method:'GET'
};

exports.getCompQuotes =function() {
    var compPrices = {};
    var stockPriceString = "";
    console.log("Company quotes are about to update");
    requestModule(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var quotes = JSON.parse(body.substring(3,body.length));
            var nStocks = quotes.length;
            //console.log(stockResponse.query.results.quote.length);
            for (var i = 0; i < nStocks; i++) {

                compPrices[quotes[i].t] = new stockPrice(quotes[i].l, quotes[i].l, quotes[i].l,quotes[i].cp,quotes[i].c);
            }

            if(compPrices!="") {
                stockPriceString = JSON.stringify(compPrices);
            }
        }
        else if(error){
            console.log(error);
        }

        if(stockPriceString!="") {
            var ins_query = 'INSERT INTO ' + db + '.' + statTable + '([LogTime],[Price]) VALUES (SYSDATETIME(),\'' + stockPriceString + '\')';
            request.query(ins_query, function (e) {
                if (e) {
                    console.log(e.message);
                    console.log("Can not insert Company Prices");
                }
                else {
                    console.log("Company quotes are updated");
                }
            });
        }
    });
}

