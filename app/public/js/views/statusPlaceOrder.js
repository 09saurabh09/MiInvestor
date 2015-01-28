/**
 * Created by SAURABH on 10/19/2014.
 */
var server = "http://192.168.0.109:8000";
price = 123456;
function changePriceType(price){
    if(document.getElementById("pricetype").value == 'LOrder')
    {
        document.getElementById('price').disabled = false;
        price = document.getElementById("pricetype").value;
    }
    else
    {
        document.getElementById('price').disabled = true;
        price = price;

    }
}

function statusPlaceOrder(){
    this.place_trade = function(stock,username){
        var order={
            "stock":"",
            "type":"",
            "subtype":"",
            "price":"",
            "quantity":"",
            "user":""
              };
        if(price == 123456)
        {
            price = document.getElementById("price").value;
        }
        //order.stock = document.getElementById("stock").value;
        order.stock = stock;
        order.user = username;

        console.log(order);

        order.type = document.getElementById("type").value;
        order.pricetype = document.getElementById("pricetype").value;
        order.tif = document.getElementById("subtype").value;
        order.price = price;
        order.quantity = parseInt(document.getElementById("quantity").value);
        $.ajax({
            url : server+"/place_trade",
            type: "POST",
            data : order,
            success: function(data, textStatus, jqXHR)
            {
                //data - response from server
                //console.log([data,textStatus,jqXHR]);
                if (textStatus == 'success') {
                    bootbox.hideAll();

                    bootbox.dialog({
                        message: "Your order has been placed, keep checking your portfolio",
                        title: "Success!",
                        buttons: {
                            success: {
                                label: "OK!",
                                className: "btn-success",
                                callback: function() {

                                }
                            }

                        }
                    });

                }
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                console.log([jqXHR,textStatus,errorThrown]);
                if(jqXHR.responseText=='Not enough resources') {
                    bootbox.hideAll();

                    bootbox.dialog({
                        message: "Please Check Cash or stocks before placing order",
                        title: "Whoops! Not enough Resources",
                        buttons: {
                            success: {
                                label: "OK!",
                                className: "btn-success",
                                callback: function() {

                                }
                            }

                        }
                    });
                }
                else{
                    bootbox.hideAll();

                    bootbox.dialog({
                    message: "Can not place your order, please try again later",
                        title: "Whoops! Network Error",
                        buttons: {
                        success: {
                            label: "OK!",
                                className: "btn-success",
                                callback: function() {

                            }
                        }

                    }
                });

                }
            }
        });
    };

    this.addToWatchlist = function(comp,symbol,username){
        var watch ={};
        watch['comp'] = comp;
        watch['symbol'] = symbol;
        watch['username'] = username;

        $.ajax({
            url : server+"/addToWatchlist",
            type: "POST",
            data : watch,
            success: function(data, textStatus, jqXHR)
            {
                //data - response from server
                //console.log([data,textStatus,jqXHR]);
                if (textStatus == 'success') {
                    bootbox.hideAll();

                    bootbox.dialog({
                        message: comp+" is added to your watchlist now you can monitor using watchlist table",
                        title: "Success!",
                        buttons: {
                            success: {
                                label: "OK!",
                                className: "btn-success",
                                callback: function() {

                                }
                            }

                        }
                    });

                }
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                bootbox.hideAll();

                bootbox.dialog({
                    message: comp+" can not be added to your watchlist, please try again later",
                    title: "Whoops! Network Error",
                    buttons: {
                        success: {
                            label: "OK!",
                            className: "btn-success",
                            callback: function() {

                            }
                        }

                    }
                });

            }
        });

        var  currWatchlist = '{}';
        currWatchlist = JSON.parse(currWatchlist);
        currWatchlist[comp]= symbol;
        currWatchlist = JSON.stringify(currWatchlist);

    }
}

var statusPlaceOrder = new statusPlaceOrder();
// setup the alert that displays when an account is successfully created //


