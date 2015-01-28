// Morris.js Charts sample data for SB Admin template
//var morrisData;
function generateMorrisAreaGraph(morrisData) {
    Morris.Line({
        element: morrisData.area.element,
        data: morrisData.area.data,
        xkey: morrisData.area.xkey,
        ykeys: morrisData.area.ykeys,
        labels: morrisData.area.labels,
        pointSize: morrisData.area.pointSize,
        hideHover: morrisData.area.hideHover,
        resize: morrisData.area.resize
    });
}

function generateMorrisDonutGraph(dataFromFeed) {
    Morris.Donut({
        element: 'morris-donut-chart',
        data: dataFromFeed,
        resize: true
    });
}

//function setMorrisDonutDataPortFolioCall(quote){
//    var dataArray = [];
//    var tempData = {};
//    var i;
//    function setData(temp) {
//        this.label=temp.label,
//        this.value=temp.value
//    };
//
//    for(i = 0 ;i<quote.length;i++){
//        tempData['label'] = quote[i].symbol;
//        tempData['value'] = (Math.abs(parseFloat(quote[i].ChangeRealtime))*(investedStocks[quote[i].symbol.toLowerCase()])).toFixed(2);
//        var temp = new setData(tempData);
//        dataArray.push(temp);
//    }
//    console.log("Plotting Donut Graph");
//    generateMorrisDonutGraph(dataArray);
//}

function setMorrisDonutData(quote){
    var dataArray = [];
    var tempData = {};
    var i;
    var investedStocksElements = [];

    function setData(temp) {
        this.label=temp.label,
            this.value=temp.value
    }

    console.log(investedStocks);

    for (var key in investedStocks) {
        if (investedStocks.hasOwnProperty(key)) {
            if (investedStocks[key] > 0) {
            investedStocksElements.push(key.toUpperCase());
            }
        }
    }

    for(i = 0 ;i<investedStocksElements.length;i++){
        tempData['label'] = investedStocksElements[i];
        tempData['value'] = (Math.abs(parseFloat(quote[investedStocksElements[i]].change))*(investedStocks[investedStocksElements[i].toLowerCase()])).toFixed(2);
        var temp = new setData(tempData);
        dataArray.push(temp);
    }
    console.log("Plotting Donut Graph");
    generateMorrisDonutGraph(dataArray);
}

function generateWatchListLineGraph() {
    $.ajax({
        url: server + "/get_company_quotes",
        type: "POST",
        data: '',
        success: function (data, textStatus, jqXHR) {
            data = JSON.parse(data);
//            console.log(data);
            if (textStatus == 'success') {
                setMorrisLineData(data);
                companyPastQuotes = data;
                companyQuotes = JSON.parse(companyPastQuotes[0].Price);
                console.log(companyQuotes);
                setMorrisDonutData(companyQuotes);
                feedsObject.showTopCompanies([companyPastQuotes[0].Price]);

            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            bootbox.hideAll();
            bootbox.dialog({
                message: "Error in Fetching Company Quotes",
                title: "error",
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
}

function setMorrisLineData(companyQuote) {
    var morrisLineData = {};
    var dataArray = [];
    var watchListElements = [];
    var tempData = {};
    var companyIndex;
    var i;
    var j;
    var k;

    for (var key in watchList) {
        if (watchList.hasOwnProperty(key)) {
            watchListElements.push(watchList[key].toUpperCase());
        }
    }
    function quoteInstance(temp) {
        this.d = temp.d;
        for (k = 0; k < watchListElements.length; k++) {
            this[watchListElements[k]] = temp[watchListElements[k]];
        }
    };

    companyIndex = Math.floor((Math.random() * watchListElements.length));
    for(i = companyQuote.length -1 ; i>= 0 ; i--){
        tempData['d'] = companyQuote[i].LogTime;
        var price = JSON.parse(companyQuote[i].Price);

        tempData[watchListElements[companyIndex]] = price[watchListElements[companyIndex]].current;

        var temp = new quoteInstance(tempData);
        dataArray.push(temp);
    }
    $("#morris-line-chart").empty();
    morrisLineData['element'] = 'morris-line-chart';
    morrisLineData['data'] = dataArray;
    morrisLineData['xkey'] = 'd';
    morrisLineData['ykey'] = [watchListElements[companyIndex]];
    morrisLineData['labels'] = [watchListElements[companyIndex]];
    morrisLineData['smooth'] = true;
    morrisLineData['resize'] = true;
    generateMorrisLineData(morrisLineData);
}

function generateMorrisLineData(morrisLineData) {
    Morris.Line({
        // ID of the element in which to draw the chart.
        element: morrisLineData.element,
        // Chart data records -- each entry in this array corresponds to a point on
        // the chart.
        data: morrisLineData.data,
        // The name of the data record attribute that contains x-visitss.
        xkey: morrisLineData.xkey,
        // A list of names of data record attributes that contain y-visitss.
        ykeys: morrisLineData.ykey,
        // Labels for the ykeys -- will be displayed when you hover over the
        // chart.
        labels: morrisLineData.labels,
        // Disables line smoothing
        smooth: morrisLineData.smooth,
        resize: morrisLineData.resize,
        ymin:'auto',
        ymax : 'auto',
        yLabelFormat : function (y) { return y.toFixed(2); }
    });
}

$(function () {
//    var morrisData;
    // Area Chart
    // Donut Chart

    // Line Chart
    // Bar Chart
    Morris.Bar({
        element: 'morris-bar-chart',
        data: [
            {
                device: 'iPhone',
                geekbench: 136
            },
            {
                device: 'iPhone 3G',
                geekbench: 137
            },
            {
                device: 'iPhone 3GS',
                geekbench: 275
            },
            {
                device: 'iPhone 4',
                geekbench: 380
            },
            {
                device: 'iPhone 4S',
                geekbench: 655
            },
            {
                device: 'iPhone 5',
                geekbench: 1571
            }
        ],
        xkey: 'device',
        ykeys: ['geekbench'],
        labels: ['Geekbench'],
        barRatio: 0.4,
        xLabelAngle: 35,
        hideHover: 'auto',
        resize: true
    });


});
