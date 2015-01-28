/**
 * Created by saurabhk on 10/31/2014.
 */
function getUserDetails(){
    this.getDetails = function(stock){
        var order={
            "stock":"",
            "type":"",
            "subtype":"",
            "price":"",
            "quantity":""

        };
        //order.stock = document.getElementById("stock").value;
        order.stock = stock;
        order.type = document.getElementById("type").value;
        order.pricetype = document.getElementById("pricetype").value;
        order.tif = document.getElementById("subtype").value;
        order.price = parseFloat(document.getElementById("price").value);
        order.quantity = parseInt(document.getElementById("quantity").value);
        $.ajax({
            url : "http://localhost:8000/place_trade",
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

    this.addToWatchlist = function(comp,symbol,currWatchlist,user_name){
        currWatchlist = JSON.parse(currWatchlist);
        currWatchlist[comp]= symbol;
        currWatchlist = JSON.stringify(currWatchlist);

        var upd_query = 'Update '+db+'.global.UserDetails Set Watchlist = '+currWatchlist+' where UserName =\''+user_name+'\'';
        request.query(upd_query,function(e){
            if(e){
                console.log(e.message);
                console.log("Watchlist not updated in User table for "+user_name);
            }
        })
    }
}

var getUserDetails = new getUserDetails();
// setup the alert that displays when an account is successfully created //