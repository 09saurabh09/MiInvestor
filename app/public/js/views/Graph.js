/**
 * Created by vikkuma2 on 10/31/2014.
 */
var investedStocks,watchList;
var transactionDetails;
var morrisData;
var companyPastQuotes;
var companyQuotes;
function getGraphData(){
//    var generateMorrisAreaGraph;
    this.bar = function(username){
        $.ajax({
            url : server+"/get_bar_data", //TODO - localhost remove hardcoded
            type: "POST",
            data : { username : username },
            success: function(data, textStatus, jqXHR)
            {
                data = JSON.parse(data);
//                console.log(data);
                investedStocks = data.investedStocks;
                watchList = data.watchList;
                transactionDetails = data.transactionDetails;
                morrisData = data.graphData;
                if (textStatus == 'success') {
                    //generateMorrisAreaGraph = data;
                    generateMorrisAreaGraph(data.graphData);
                    generateWatchListLineGraph();
                    setInterval(function(){setMorrisLineData(companyPastQuotes)},1000*10);

                    portfolioObject.generateQuery(investedStocks);
//                    console.log(watchList);
                    portfolioObject.CreateWatchlistTable(watchList);//function for creating table, will execute in start
                    portfolioObject.getQuotes(watchList);
                    portfolioObject.CreateTransactionTable(transactionDetails);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                bootbox.hideAll();
                bootbox.dialog({
                    message: "Error fetching the page load data from Server",
                    title: "oops!",
                    buttons: {
                        success: {
                            label: "OK!",
                            className: "btn-success",
                            callback: function () {
                            }
                        }

                    }
                });
            }
        });
    };
}

var getGraphDataObject = new getGraphData();
// setup the alert that displays when an account is successfully created //
