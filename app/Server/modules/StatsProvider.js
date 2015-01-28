/**
 * Created by vikkuma2 on 11/1/2014.
 */
var connection  = require('./connection');
var request = connection.request;
var db = connection.db;
var graphDataFromMorris;
var lineGraphData;

exports.fetchGraphData = function(reqData,callback) {

    var selQueryGraphStat = 'Select * from ' + db + '.local.U' + reqData.username + 'Stats where EntryDate in(Select max(EntryDate) from ' + db + '.local.U' + reqData.username + 'Stats group by  CAST(EntryDate AS DATE))';
    var selQueryUserData = 'Select Watchlist , StockDetails from ' + db + '.global.UserDetails where UserName = \''+reqData.username +'\'' ;
    var selQueryTransactionDetails = 'Select TOP 8 * from '+db+'.local.U'+reqData.username+'OrderBook order by LogTime desc'

    request.query(selQueryGraphStat, function (e, statsRS) {
        if (e) {
            callback(e);
            console.log(e.message);
            console.log("Error in fetching stats for user - " + reqData.username);
        }
        else {
            console.log("Data fetched from DB for plotting graphs");

            request.query(selQueryUserData, function (e, userDetailRS) {
                if (e) {
                    callback(e);
                    console.log(e.message);
                    console.log("Error in fetching watchlist for user - " + reqData.username);
                }
                else {
                    console.log("Data fetched from DB for watchList");

                    request.query(selQueryTransactionDetails, function (e, transactionDetailsRS) {
                        if (e) {
                            callback(e);
                            console.log(e.message);
                            console.log("Error in fetching transaction details for user - " + reqData.username);
                        }
                        else {
                            console.log("Data fetched from DB for transaction details");
                            mapToMorrisData(statsRS,function(graphData){
                                graphDataFromMorris = graphData;
                            });
                            console.log(userDetailRS[0]);
                            var response = {
                                graphData: graphDataFromMorris,
                                investedStocks : JSON.parse(userDetailRS[0].StockDetails),
                                watchList:JSON.parse(userDetailRS[0].Watchlist),
                                transactionDetails : transactionDetailsRS
                            }
                            callback(null,JSON.stringify(response));
                        }
                    });
                }
            });
        }
    });
}

exports.fetchCompanyQuotes = function(reqData,callback) {
    var selQueryCompanyQuotes = 'Select TOP 30 * from ' + db + '.global.CompanyStats order by LogTime desc';
    var i;
    request.query(selQueryCompanyQuotes, function (e, companyQuotesRS) {
        if (e) {
            callback(e);
            console.log(e.message);
            console.log("Error in fetching companyQuotes");
        }
        else {
            console.log("Company Quotes Fetched DB to be send to client");
            for(i= 0 ; i< companyQuotesRS.length;i++){
                companyQuotesRS[i].LogTime = companyQuotesRS[i].LogTime.getTime();
            }
            callback(null,JSON.stringify(companyQuotesRS));
        }
    });
}

mapToMorrisData = function(dbResultSet,callback) {
    var i;
    var tempData ={};
     function setData(temp) {
        this.period=temp.period,
        this.Cash=temp.Cash,
        this.SharesWorth=temp.SharesWorth,
        this.NetWorth=temp.NetWorth
    };
    var areaGraphData = {
        element: 'morris-area-chart',
        data: [       ],
        xkey: 'period',
        ykeys: ['Cash', 'SharesWorth', 'NetWorth'],
        labels: ['Cash', 'SharesWorth', 'NetWorth'],
        pointSize: 2,
        hideHover: 'auto',
        resize: true
    }


    for (i = 0; i < dbResultSet.length; i++) {

        tempData['period'] = dbResultSet[i].EntryDate.getTime();
        tempData['Cash'] = dbResultSet[i].Cash;
        tempData['SharesWorth'] = dbResultSet[i].SharesWorth;
        tempData['NetWorth'] = dbResultSet[i].Cash + dbResultSet[i].SharesWorth;
        var temp = new setData(tempData);
        areaGraphData.data.push(temp);
    }

    var graphData = {
        area: areaGraphData,
//        donut: donutGraphData
    }

    callback(graphData);
}
