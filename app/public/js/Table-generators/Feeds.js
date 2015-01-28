/**
 * Created by SAURABH on 11/3/2014.
 */
var nOfHeadlines = 8;
function feeds(){

}

var feedsObject = new feeds();

feeds.prototype.CreatefeedTable = function() {
    var body = document.body,
        tbl_feed = document.createElement('table');

    var header = tbl_feed.createTHead();
    tbl_feed.className = "table table-bordered table-hover";
    var row = header.insertRow();
    row.className = "th";
    var th = row.insertCell();

// Ceating headings
    th.innerHTML = "<b>News Headlines</b>";

    var k = 0;

    for (var i = 0; i < nOfHeadlines; i++) {
        var tr = tbl_feed.insertRow();
        for (var j = 0; j < 1; j++) {
            var td = tr.insertCell();
            //td.appendChild(document.createTextNode("News"));//News

            var text = document.createElement("p");
            text.id = i+"news";// Giving unique id
            //text.className ="text1-2";
            text.innerHTML = "Select a Stock to get news";
            td.appendChild(text);
        }


    }
    var tb = document.getElementsByName("feed");

    tb[0].appendChild(tbl_feed);

};

feedsObject.CreatefeedTable();

feeds.prototype.updateFeedTable = function(feedData) {

    for (var i=0; i < nOfHeadlines; i++)
    {
        var tag = i+"news";
        document.getElementById(tag).innerHTML = '<a target="_blank" href="'+feedData[i].href+'">'+feedData[i].content+'</a>';

    }
};

$( "#feeds" ).autocomplete({
    minLength: 0,
    source: function(request, response) {
        var results = $.ui.autocomplete.filter(stocks, request.term);

        response(results.slice(0, 4));
    },
    focus: function( event, ui ) {
        $( "#feeds" ).val( ui.item.label );
        return false;
    },
    select: function( event, ui ) {
//alert("You have selected "+ui.item.label);

        // Fetching data for selected stock

        var feedURL ='https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D\'' +
            'http%3A%2F%2Ffinance.yahoo.com%2Fq%3Fs%3D'+ui.item.value+'\'%20and%20xpath%3D\'%2F%2Fdiv%5B%40id%3D' +
            '%22yfi_headlines%22%5D%2Fdiv%5B2%5D%2Ful%2Fli%2Fa\'&format=json&diagnostics=true&env=store%3' +
            'A%2F%2Fdatatables.org%2Falltableswithkeys&callback=';

        console.log(feedURL);
        $.ajax({
            url: feedURL,
            dataType: 'json',
            success:function( feeds ) {
                // Create table or feeds
                console.log(feeds.query.results);
                var det;
                //document.getElementById("datentime").innerHTML	= feeds.query.results.quote.LastTradeDate;										  			json.query.results.quote.LastTradeTime+" ET";
                feedsObject.updateFeedTable(feeds.query.results.a);


            }
        });



        return false;
    }
})
    .autocomplete( "instance" )._renderItem = function( ul, item ) {
//ul.addClass("nav nav-pills nav-stacked");
    ul.addClass("dropdowncustom");
    return $( "<li class=\"dropdowncustom\">" )
        .append( "<a  style=\"max-height:100px;\">" + item.label + "<br>" + item.desc + "</a>" )
        .appendTo( ul );
};

var feedDataStart = [];
feeds.prototype.updateFeedTableFirstTime = function() {
    var k = 0;
    var obj = [1,2,3];

    obj.forEach(function(entry){

        var comp = listOfCompanies[Math.floor((Math.random() * 20) + 1)];
        var feedURL ='https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D\'' +
            'http%3A%2F%2Ffinance.yahoo.com%2Fq%3Fs%3D'+comp+'\'%20and%20xpath%3D\'%2F%2Fdiv%5B%40id%3D' +
            '%22yfi_headlines%22%5D%2Fdiv%5B2%5D%2Ful%2Fli%2Fa\'&format=json&diagnostics=true&env=store%3' +
            'A%2F%2Fdatatables.org%2Falltableswithkeys&callback=';

        $.ajax({
            url: feedURL,
            dataType: 'json',
            success:function( feeds ) {
                // Create table or feeds

                //document.getElementById("datentime").innerHTML	= feeds.query.results.quote.LastTradeDate;										  			json.query.results.quote.LastTradeTime+" ET";
                //feedsObject.updateFeedTable(feeds.query.results);

                if((feeds.query.results!=null)) {
                    feedDataStart.push(feeds.query.results.a[0]);
                    feedDataStart.push(feeds.query.results.a[1]);
                    feedDataStart.push(feeds.query.results.a[2]);
                    feedDataStart.push(feeds.query.results.a[3]);
                }
                k = k+1;
                if(k==3)
                {
                    feedsObject.updateFeedTable(feedDataStart);
                }
            }
        });
        // If the feeds did not updated due to network problem
        setTimeout(function(){feedsObject.updateFeedTable(feedDataStart)},3000);
    });



};

feedsObject.updateFeedTableFirstTime();

function stockType (symbol,change,changep,price){
    this.symbol = symbol;
    this.change = change;
    this.changep = changep;
    this.price = price;

}

feeds.prototype.showTopCompanies = function(compList) {
    var topData = [];
    var sortTopData = [];
    for(var j = 0; j <listOfCompanies.length;j++) {
        var tmp = new stockType(listOfCompanies[j],compList[listOfCompanies[j].toUpperCase()].change,compList[listOfCompanies[j].toUpperCase()].pchange,compList[listOfCompanies[j].toUpperCase()].current);
        topData.push(tmp);
    }
    console.log(topData[0]);

    function sortResults(prop, asc) {
        sortTopData = topData.sort(function(a, b) {
            if (asc) return (a[prop] > b[prop]);
            else return (b[prop] > a[prop]);
        });
        console.log(sortTopData);
    }
    sortResults('change', true);
    feedsObject.CreateTopCompanyTable(sortTopData)
};
// Show most profitable and loss company

feeds.prototype.CreateTopCompanyTable = function(stocks){
    console.log(stocks);
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
    th.innerHTML = "<b>Change</b>";
    th = row.insertCell();
    th.innerHTML = "<b>Change Percent</b>";


    for(var i = 0; i < nOfHeadlines/2; i++) {


            var tr = tbl.insertRow();
            for (var j = 0; j < 4; j++) {
                var td = tr.insertCell();
                if (j == 0) {
                    td.appendChild(document.createTextNode(stocks[i].symbol));//First Column is stock symbol
                }
                else if (j == 1) {

                    td.appendChild(document.createTextNode("$"+ stocks[i].price));//Second column for currentPrice
                }

                else if (j == 2) {

                    td.appendChild(document.createTextNode(stocks[i].change));//Second column for currentPrice
                }

                else {
                    td.appendChild(document.createTextNode(stocks[i].changep));//For quantity
                }
            }


    }
    var l = stocks.length-4;
    for(var i = 0; i < nOfHeadlines/2; i++) {


        var tr = tbl.insertRow();
        for (var j = 0; j < 4; j++) {
            var td = tr.insertCell();
            if (j == 0) {
                td.appendChild(document.createTextNode(stocks[i+l].symbol));//First Column is stock symbol
            }
            else if (j == 1) {

                td.appendChild(document.createTextNode("$"+ stocks[i+l].price));//Second column for currentPrice
            }

            else if (j == 2) {

                td.appendChild(document.createTextNode(stocks[i+l].change));//Second column for currentPrice
            }

            else {
                td.appendChild(document.createTextNode(stocks[i+l].changep));//For quantity
            }
        }


    }

    var tb = document.getElementsByName("topcompanies");

    tb[0].appendChild(tbl);
    //body.appendChild(tbl);
};