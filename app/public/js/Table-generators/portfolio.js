/**
 * Created by saurabhk on 11/2/2014.
 */
//var stocks = {"goog":9,"msft":0,"fb":98,"aapl":0,"adbe":0,"amzn":0,"bidu":0,"csco":0,"ebay":0,"foxa":0,"intc":0,"nflx":0,"ntap":0,"nvda":0,"qcom":0,"sbux":0,"txn":0,"yhoo":0,"vod":0,"atvi":0};
function portfolio(){

}
//setInterval(function(){console.log(investedStocks)},1000);
/*
var stocks = {'GOOGLE':'goog',
    'MICROSOFT':'msft',
    'FACEBOOK':'fb',
    'DIRECTV':'DTV '
};
*/
    var final = [];
    var red= "#FF0000";
    var green = "#66CD00";
    var white = "#FFFFFF";
    var query="";
    var stocksGlobal;
portfolio.prototype.CreateWatchlistTable = function(stocks){
        var body = document.body,
            tbl  = document.createElement('table');
        stocksGlobal = stocks;
        var header = tbl.createTHead();
        tbl.className ="table table-bordered table-hover";
        var row = header.insertRow();
        row.className ="th";
        var th = row.insertCell();

        // Ceating headings
        th.innerHTML = "<b>Name</b>";
        th = row.insertCell();
        th.innerHTML = "<b>LTP</b>";
        th = row.insertCell();
        th.innerHTML = "<b>%Change</b>";
        th = row.insertCell();
        th.innerHTML = "<b>Open</b>";
        th = row.insertCell();
        th.innerHTML = "<b>High</b>";
        th = row.insertCell();
        th.innerHTML = "<b>Low</b>";

        for(var i = 0; i < Object.keys(stocks).length; i++){
            var tr = tbl.insertRow();
            for(var j = 0; j < 6; j++){
                var td = tr.insertCell();
                if(j==0)
                {
                    td.appendChild(document.createTextNode(Object.keys(stocks)[i]+' ('+stocks[Object.keys(stocks)[i]]+')'));//First Column is stock Name
                }

                else if (j==1)
                {
                    //This column is for reatime price
                    var text = document.createElement("p");
                    text.id = Object.keys(stocks)[i]+"price";// Giving unique id
                    //text.className ="text1-2";
                    text.innerHTML = "Refreshing";
                    td.appendChild(text);
                }

                else if(j==2)
                {
                    //Column for variance
                    var text = document.createElement("p");
                    text.id = Object.keys(stocks)[i]+"var";//Giving Unique id
                    text.innerHTML = "Refreshing";
                    td.appendChild(text);
                }
                else if(j==3)
                {
                    //Column for variance
                    var text = document.createElement("p");
                    text.id = Object.keys(stocks)[i]+"open";//Giving Unique id
                    text.innerHTML = "Refreshing";
                    td.appendChild(text);
                }
                else if(j==4)
                {
                    //Column for variance
                    var text = document.createElement("p");
                    text.id = Object.keys(stocks)[i]+"high";//Giving Unique id
                    text.innerHTML = "Refreshing";
                    td.appendChild(text);
                }
                else
                {
                    //Column for variance
                    var text = document.createElement("p");
                    text.id = Object.keys(stocks)[i]+"low";//Giving Unique id
                    text.innerHTML = "Refreshing";
                    td.appendChild(text);
                }
            }
        }
        var tb = document.getElementsByName("watchlistTable");
        tb[0].appendChild(tbl);
        //body.appendChild(tbl);

    //We have to create a query so that all the data can be fetched at once


    for(var i = 0; i < Object.keys(stocks).length; i++)
    {
        if(i==Object.keys(stocks).length-1)
        {
            query = query+stocks[Object.keys(stocks)[i]];
        }
        else
        {
            query = query+stocks[Object.keys(stocks)[i]] +'%2C';
        }

    }
    };

var portfolioObject = new portfolio();


var quotedata = setInterval(function(){portfolioObject.getQuotes(stocksGlobal)},20000);// periodically fetches data and update cells

portfolio.prototype.getQuotes = function(stocks){
        var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20"+
            "where%20symbol%20in%20%28%22"+query+"%22%29&format=json&diagnostics="+
            "true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";

        $.ajax({
            url: url,
            dataType: 'json',
            success:function( json ) {

                for(var i = 0; i < Object.keys(stocks).length; i++){
                    var price_tag = Object.keys(stocks)[i]+"price";// For accessing element of this id
                    var var_tag = Object.keys(stocks)[i]+"var";//same
                    var open_tag = Object.keys(stocks)[i]+"open";//same
                    var high_tag = Object.keys(stocks)[i]+"high";//same
                    var low_tag = Object.keys(stocks)[i]+"low";//same
                    var str = document.getElementById(price_tag).innerHTML// To get previous realtime price
                    document.getElementById(price_tag).className ="change_price";
                    if(parseFloat(str.substring(1, str.len))<parseFloat(json.query.results.quote[i].LastTradePriceOnly))
                    {
                        //Share price increases since last tick
                        document.getElementById(price_tag).style.background=green;
                        //setTimeout(function() { document.getElementById(price_tag).style.background=white;}, 1000);
                    }
                    else if(parseFloat(str.substring(1, str.len))>parseFloat(json.query.results.quote[i].LastTradePriceOnly))
                    {
                        //Share price decreases since last tick
                        document.getElementById(price_tag).style.background=red;
                        //setTimeout(function() { document.getElementById(price_tag).style.background=white;}, 1000);559.08
                    }
                    // Updating current price and variance
                    document.getElementById(price_tag).innerHTML ="$"+ parseFloat(json.query.results.quote[i].LastTradePriceOnly).toFixed(2);
                    document.getElementById(var_tag).innerHTML = (json.query.results.quote[i].ChangeinPercent);
                    document.getElementById(open_tag).innerHTML = (json.query.results.quote[i].Open);
                    document.getElementById(high_tag).innerHTML = (json.query.results.quote[i].DaysHigh);
                    document.getElementById(low_tag).innerHTML = (json.query.results.quote[i].DaysLow);
                    //console.log([json.query.results.quote.AskRealtime,json.query.results.quote[i].ChangeinPercent]);

                    if(json.query.results.quote[i].ChangeinPercent[0]=="-")
                    {
                        document.getElementById(var_tag).className ="loss";
                    }
                    else
                    {
                        document.getElementById(var_tag).className ="profit";
                        //document.getElementById(price_tag).className ="profit_price";
                        //$('.profit_price').css('background', red);
                        //setTimeout(function() { $('.profit_price').css('background', white);}, 2000);
                    }
                }
            }
        });
    };

var queryForPortfolio = "";
var portfolioData;
portfolio.prototype.generateQuery = function(stocks) {
    for (var i = 0; i < Object.keys(stocks).length; i++) {
        if(stocks[Object.keys(stocks)[i]]>0) {
            if (i == Object.keys(stocks).length - 1) {
                queryForPortfolio = queryForPortfolio + Object.keys(stocks)[i];
            }
            else {
                queryForPortfolio = queryForPortfolio + Object.keys(stocks)[i] + '%2C';
            }
        }
    }

    var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20"+
        "where%20symbol%20in%20%28%22"+queryForPortfolio+"%22%29&format=json&diagnostics="+
        "true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";

    $.ajax({
        url: url,
        dataType: 'json',
        success: function (json) {
            portfolioData = json;
            portfolioObject.CreatePortfolioTable(stocks);
//            setMorrisDonutData(portfolioData.query.results.quote);
        }
    });
};

portfolio.prototype.CreatePortfolioTable = function(stocks){
    var body = document.body,
        tbl  = document.createElement('table');

    var header = tbl.createTHead();
    tbl.className ="table table-bordered table-hover";
    var row = header.insertRow();
    row.className ="th";
    var th = row.insertCell();

    // Ceating headings
    th.innerHTML = "<b>Scrip</b>";
    th = row.insertCell();
    th.innerHTML = "<b>Price</b>";
    th = row.insertCell();
    th.innerHTML = "<b>Qty</b>";
var k = 0;

    for(var i = 0; i < Object.keys(stocks).length; i++) {
        if (stocks[Object.keys(stocks)[i]] > 0){

            var tr = tbl.insertRow();
            for (var j = 0; j < 3; j++) {
                var td = tr.insertCell();
                if (j == 0) {
                    td.appendChild(document.createTextNode(Object.keys(stocks)[i]));//First Column is stock symbol
                }
                else if (j == 1) {

                    td.appendChild(document.createTextNode("$"+ parseFloat(portfolioData.query.results.quote[k].LastTradePriceOnly).toFixed(2)));//Second column for currentPrice
                }

                else {
                    td.appendChild(document.createTextNode(stocks[Object.keys(stocks)[i]]));//For quantity
                }
            }
            k = k+1;
        }

    }
    var tb = document.getElementsByName("portfolio");

    tb[0].appendChild(tbl);
    //body.appendChild(tbl);
};


portfolio.prototype.CreateTransactionTable = function(tData){
    var body = document.body,
        tbl  = document.createElement('table');

    var header = tbl.createTHead();
    tbl.className ="table table-bordered table-hover";
    var row = header.insertRow();
    row.className ="th";
    var th = row.insertCell();

    // Ceating headings
    th.innerHTML = "<b>OrderId</b>";
    th = row.insertCell();
    th.innerHTML = "<b>Order Time</b>";
    th = row.insertCell();
    th.innerHTML = "<b>Scrip</b>";
    th = row.insertCell();
    th.innerHTML = "<b>Price (USD)</b>";
    th = row.insertCell();
    th.innerHTML = "<b>Market/Limit</b>";
    th = row.insertCell();
    th.innerHTML = "<b>Buy/Sell</b>";
    th = row.insertCell();
    th.innerHTML = "<b>Quantity</b>";
    th = row.insertCell();
    th.innerHTML = "<b>Status</b>";
    var k = 0;

    for(var i = 0; i < tData.length; i++) {


            var tr = tbl.insertRow();
            for (var j = 0; j < 8; j++) {
                var td = tr.insertCell();
                if (j == 0) {
                    td.appendChild(document.createTextNode(tData[i].OrderId.split(" ")[0]));//OrderId
                }
                else if (j == 1) {

                    td.appendChild(document.createTextNode(tData[i].LogTime));//OrderTime
                }

                else if (j == 2) {

                    td.appendChild(document.createTextNode(tData[i].CompanyCode));//OrderTime
                }
                else if (j==3){
                    td.appendChild(document.createTextNode(tData[i].Price));//Price
                }

                else if (j==4){
                    td.appendChild(document.createTextNode(tData[i].PriceType));//Limit
                }

                else if (j==5){
                    td.appendChild(document.createTextNode(tData[i].OrderType));//OrderType
                }

                else if(j==6){
                    td.appendChild(document.createTextNode(tData[i].Qty));//Quantity
                }

                else {
                    td.appendChild(document.createTextNode(tData[i].StateOfTxn));//Status
                }

            }
            k = k+1;


    }
    var tb = document.getElementsByName("transactionTable");

    tb[0].appendChild(tbl);
    //body.appendChild(tbl);
};