var sql   = require('mssql');
var connection  = require('./connection');

var request = connection.request;

 // or: var request = connection.request();
var minmax={};
var db = 'MiInvestor';
var user_name;
ExtMinMax();
function ExtMinMax() {
    request.query('select * from '+db+'.global.MinMax', function (e, o) {
        if (e) {
            console.log(e.message);
            console.log("Can not select from MinMax");
        }

        else {

            for (var i = 0; i < o.length; i++) {
                minmax[o[i]['CompanyCode']] = {'maxB': o[i]['MaxB'], 'minS': o[i]['MinS']};

            }
        }
        //minmax = o;
    });
}

exports.check_status = function(order_details,callback){
    user_name = order_details.user;
    var order_amount = parseFloat(order_details.price)*parseInt(order_details.quantity);
    var sel_query_for_stat = 'Select TOP 1 * from '+db+'.local.U'+order_details.user+'Stats order by EntryDate desc';
    var cash,sd;
    request.query(sel_query_for_stat,function(e,o){
        if(e){
            callback(e);
            console.log(e.message);
            console.log("Data not present for "+order_details.user);
        }
        else{

            sd = JSON.parse(o[0]['StockDetails']);
            console.log(sd[order_details.stock]);
            if((order_details.type=='buy')&&(o[0]['Cash']<order_amount))// Check for Cash
            {
                callback('error');
                console.log("Not enough Cash");
            }
            else if((order_details.type=='sell')&&((sd[order_details.stock]<parseInt(order_details.quantity))||(sd[order_details.stock]==undefined)||(sd[order_details.stock]=='undefined')))// Check for Stocks
            {
                console.log(sd[order_details.stock]);
                callback('error');
                console.log("Not enough stocks");
            }
            else
            {   // Deduct cash in case of buy order or stocks in case of sell order
                if(order_details.type=='buy')
                {
                    cash = o[0]['Cash'] -  order_amount;
                    sd = JSON.parse(o[0]['StockDetails']);
                    // sd[orders[0].Stock] = parseInt(sd[orders[0].Stock]) - parseInt(orders[0].Qty);
                    // stocks should be updated while placing order
                    sd[order_details.stock] = parseInt(sd[order_details.stock]);
                }

                else if(order_details.type=='sell')
                {
                    cash = o[0]['Cash'];
                    sd = JSON.parse(o[0]['StockDetails']);
                    // sd[orders[0].Stock] = parseInt(sd[orders[0].Stock]) - parseInt(orders[0].Qty);
                    // stocks should be updated while placing order
                    sd[order_details.stock] = parseInt(sd[order_details.stock]) - parseInt(order_details.quantity) ;
                }
                    // Compute Current value of invested stocks
                    getStockValue(sd,function(sharesWorth){
                        sd = JSON.stringify(sd);



                        var ins_query =  'INSERT INTO '+db+'.local.U'+order_details.user+'Stats ([EntryDate],[Cash],SharesWorth,StockDetails)'+
                            'VALUES'+'(SYSDATETIME(),\''+cash+'\',\''+sharesWorth+'\',\''+sd+'\')';

                        updateUserStat(cash,sd,order_details.user,sharesWorth);// To update stats in user table
                        console.log(ins_query);
                        request.query(ins_query,function(e){
                            if(e)
                            {
                                console.log(e.message);
                                console.log("Order not added to personal stat table  in pre check");
                            }
                        });
                    });



                callback(null);
            }
        }
    });
};

exports.place_trade = function(order_details,callback)
    {
        user_name = order_details.user;
        var table = 'googOrderBookC';
        //var table = order_details.stock+'OrderBookC';//default table name
        // Add order to order book and personal table
        var insert_query = 'INSERT INTO '+db+'.local.['+table+'] ([logtime],[OrderType],company,[PriceType],[TIF] ,[Price],[Qty],[UserName])'+
            'VALUES'+'(SYSDATETIME(),\''+order_details.type+'\',\''+order_details.stock+'\',\''+order_details.pricetype+'\',\''+order_details.tif+'\',\''+order_details.price+'\',\''+order_details.quantity+'\',\''+order_details.user+'\')'+
            'SELECT SCOPE_IDENTITY() AS id';

        // Updating the order book for particular company
        request.query(insert_query,function(e,o){
            if(e){
                callback(e);
                console.log(e.message);
                console.log("Trade Not Placed");
            }
            else
            {
                var comp = order_details.stock;
                order_details['id'] = o[0]['id'];

                var pending ='pending';
                var insert_p_query = 'INSERT INTO '+db+'.local.U'+order_details.user+'OrderBook ([logtime],[OrderType],OrderId,[CompanyCode],[PriceType],[TIF] ,[StateOfTxn],[Price],[Qty],leftover)'+
                    'VALUES'+'(SYSDATETIME(),\''+order_details.type+'\',\''+order_details['id']+'\',\''+comp+'\',\''+order_details.pricetype+'\',\''+order_details.tif+'\',\''+pending+'\',\''+order_details.price+
                    '\',\''+order_details.quantity+'\',\''+order_details.quantity+'\')';

                // Adding entry to personal table
                request.query(insert_p_query,function(e,o){
                    if(e)
                    {
                        console.log(e.message);
                        console.log("Entry not added to "+db+'.local.U'+order_details.user+'OrderBook');
                    }
                });

                // Checking maximum ask price increase or not
                console.log(minmax);
                if((order_details.type =='buy')&&(parseFloat(order_details.price)>parseFloat(minmax[comp].maxB)))
                {
                    console.log("High Bid price");
                    minmax[comp].maxB = parseFloat(order_details.price);
                    request.query('Update '+db+'.global.MinMax set MaxB='+order_details.price+'where CompanyCode =\''+comp+'\'',function(e,o){
                        if(e){
                            callback(e);
                            console.log(e.message);
                            console.log("MinMax MaxB not updated");
                        }
                    });

                    if(minmax[comp].maxB>minmax[comp].minS)// There will be a trade
                    {
                        callback(null,order_details);
                    }
                    else{callback(null);}
                }
                // Checking minimum sell price decreases or not
                else if((order_details.type =='sell')&&(parseFloat(order_details.price)<parseFloat(minmax[comp].minS)))
                {
                    console.log("Low Bid price");
                    minmax[comp].minS = parseFloat(order_details.price);
                    request.query('Update '+db+'.global.MinMax set MinS='+order_details.price+'where CompanyCode =\''+comp+'\'',function(e,o){
                        if(e){
                            callback(e);
                            console.log(e.message);
                            console.log("MinMax MinS not updated");
                        }
                    });

                    if(minmax[comp].maxB>minmax[comp].minS)// There will be a trade
                    {
                        callback(null,order_details);
                    }
                    else{callback(null);}
                }
                else
                {   // Since there is not a trade Delete if it was FOK order
                    console.log(order_details);
                    if(order_details.tif == 'fok')
                    {
                        var delQuery1 = 'DELETE FROM '+db+'.local.['+table+'] WHERE OrderId = ' + order_details['id']; // From Company OrderBook
                        var delQuery2 = 'DELETE '+db+'.local.U'+order_details.user+'OrderBook  where orderid = \''+order_details['id']+'\'';
                        var delQuery3 = 'DELETE FROM '+db+'.local.U'+order_details.user+'Stats WHERE EntryDate in (Select max(EntryDate) FROM '+db+'.local.U'+order_details.user+'Stats)';
                        console.log(delQuery3);
                        request.query(delQuery1,function(e){

                            if(e) {
                                console.log(e.message);
                                console.log("FOK order not deleted from stock table");
                            }
                        });

                        request.query(delQuery2,function(e){
                            if(e) {
                                console.log(e.message);
                                console.log("FOK order not deleted from user table");
                            }
                        });

                        request.query(delQuery3,function(e){
                            if(e) {
                                console.log(e.message);
                                console.log("Cash and stocks can not be reverted back");
                            }
                        });




                    }
                    callback(null);
                }
            }
        });




    };



exports.trade = function(order_det,callback)
    {
        console.log("lets trade on "+order_det.id);
        // For buy order populate all sell order less than buy order and vice versa
        //var table = order_det.stock+'OrderBookC';
        var table = 'googOrderBookC';
        if(order_det.type=='buy')
        {   var sel_query = 'SELECT * from '+db+'.local.['+table+'] where OrderType = \'sell\' and company =\''+order_det.stock+'\' and Price <=\''+order_det.price+'\' and Username <>\''+user_name+'\' order by logTime'
            request.query(sel_query,function(e,o){
                if(e){
                    console.log(sel_query);
                    console.log(e.message);
                    console.log("Can not select previous orders for trade");
                    callback(e);

                }
                else{
                    callback(null);
                    // No callback for this function, if there is any error it will be printed in log
                    DoTrade(o,order_det);
                }

         });
            //callback(null);
        }
        else
        {
            var sel_query = 'SELECT * from '+db+'.local.['+table+'] where OrderType = \'buy\' and company =\''+order_det.stock+'\' Username <> \''+order_det.user+'\' and Price >=\''+order_det.price+'\' order by logTime'
            request.query(sel_query,function(e,o){
                if(e){
                    console.log(e.message);
                    console.log("Can not select previous orders for trade");
                    callback(e);

                }
                else{
                    callback(null);
                    // No callback for this function, if there is any error it will be printed in log
                    DoTrade(o,order_det);

                }

            });
            //callback(null);
        }


    };

// Remember No callback in this function, print the stacktrace there
var DoTrade = function(oldOrder,newOrder){
    //var delTable = JSON.parse(JSON.stringify(newOrder.stock+'OrderBookC'));
    var delTable = 'googOrderBookC'
    var toTrade = newOrder.quantity;
    var i = 0;
    var fok = 0;
    var tradeCompleted = 0;
    var leftover = 0;
    var orderToPass={};
    var queue = [];// For storing id of rows to be deleted
    var user1,user2,tradeId1,tradeId2;
    console.log([toTrade,oldOrder.length]);
    while((toTrade > 0)&& (i<oldOrder.length))
    {
        tradeQuantity = Math.min(oldOrder[i]['Qty'],toTrade);
        tradePrice = oldOrder[i]['Price'];

        if(oldOrder[i]['Qty']<toTrade)
        {
            orderToPass = oldOrder[i];
            orderToPass['Stock'] = newOrder['Stock'];
            //queue.push(oldOrder[i]['OrderId']);
            queue.push({'orderid':oldOrder[i]['OrderId'],'user':oldOrder[i]['UserName'],'update':orderToPass});
            tradeId = oldOrder[i]['OrderId'];
            //leftover = toTrade - oldOrder[i]['Quantity'];
        }
        else if (oldOrder[i]['Qty']>toTrade)
        {
            //queue.push(newOrder.id);
            orderToPass['UserName'] = newOrder.user;
            orderToPass['OrderType'] = newOrder.type;
            orderToPass['Price'] = oldOrder[i]['Price']; // Pricing is FIFO based
            orderToPass['Qty'] = newOrder.quantity;
            orderToPass['Stock'] = newOrder.stock;

            queue.push({'orderid':newOrder.id,'user':newOrder.user,'update':orderToPass});
            tradeId = newOrder.id;
            leftover = oldOrder[i]['Qty']-toTrade;
        }
        else
        {
            fok = 1;
            tradeId1 = oldOrder[i]['OrderId'];
            tradeId2 = newOrder.id;
            user1 = oldOrder[i]['UserName'];
            user2 = newOrder.user;
        }
        if(fok ==0) {
            console.log("fok = 0");

            console.log("Id1: " + oldOrder[i]['OrderId'] + " Id2: " + newOrder.id);
            queue.forEach(function(entry){
                var delQuery = 'DELETE FROM '+db+'.local.['+delTable+'] WHERE OrderId = ' + entry.orderid;
                request.query(delQuery, function (e, o) {
                if (e) {
                    console.log(e.message);
                    console.log("Row not deleted");
                }
                else {
                    UpdatePersonalAccount([entry.update]);// For updating cash and stocks
                    //While deleting you have to update pending order to done
                    var done = 'Done';
                    var newOrderId = entry.orderid+' ts '+ Date().substring(3,25);

                    var update_p_query = 'Update '+db+'.local.U'+entry.user+'OrderBook SET [StateOfTxn] =\''+done+'\' ,' +
                        'TriggerPrice = \''+tradePrice+'\',OrderId = \''+newOrderId+'\', leftover = 0,TriggerTime' +
                        ' = SYSDATETIME()  where orderid = \''+entry.orderid+'\'';
                    console.log(update_p_query);
                    request.query(update_p_query,function(e,o){
                        if(e)
                        {
                            console.log(e.message);
                            console.log("State of TXN not changed1");
                        }
                    });

                    //tradeCompleted =1;
                    if(((toTrade == 0)|| (i==oldOrder.length))){
                        var orderToUpdate = {};
                        console.log("Trade completed @ " + tradePrice);
                        console.log("left"+[toTrade,leftover]);
                        // If Some Part of stock is traded, update the remaining means what is left for trading
                        if(toTrade>leftover){
                            updQuery = 'Update '+db+'.local.['+delTable+'] SET QTY='+toTrade+'where Orderid ='+newOrder.id;
                            orderToUpdate['user']= newOrder.user;
                            orderToUpdate['id'] =  newOrder.id;
                            orderToUpdate['leftover'] = toTrade;
                            orderToUpdate['type'] = newOrder.type;
                            orderToUpdate['price'] = tradePrice;
                            update_partial(orderToUpdate);
                        }
                        else {
                            console.log("TO trade "+toTrade);
                            console.log(i);
                            // Problem is here
                            updQuery = 'Update '+db+'.local.['+delTable+'] SET QTY='+leftover+' where Orderid ='+oldOrder[i-1]['OrderId'];
                            orderToUpdate['user']= oldOrder[i-1].UserName;
                            orderToUpdate['id'] =  oldOrder[i-1].OrderId;
                            orderToUpdate['leftover'] = leftover;
                            orderToUpdate['type'] = oldOrder[i-1].OrderType;
                            orderToUpdate['price'] = tradePrice;
                            update_partial(orderToUpdate);
                        }
                        // We have to update stat and orderbook for partial trade

                        request.query(updQuery,function(e){
                            if(e) {
                                console.log(e.message);
                                console.log("QTY not updated");
                            }
                        });

                        // Similarly No callbacks for this function either
                        UpdMinMax(delTable,newOrder);
                        }
                    }
                });
            });
        }
        else
        {   console.log("fok = 1");
            var delQuery1 = 'DELETE FROM '+db+'.local.['+delTable+'] WHERE OrderId = '+tradeId1;
            var delQuery2 = 'DELETE FROM '+db+'.local.['+delTable+'] WHERE OrderId = '+tradeId2;
            request.query(delQuery1,function(e,o){
                if(e){
                    console.log(e.message);
                    console.log("Row not deleted");
                }
                else{
                    request.query(delQuery2,function(e,o){
                        if(e){
                            console.log(e.message);
                            console.log("Row not deleted");
                        }
                        else{
                            var done = 'Done';
                            var newOrderId1 = tradeId1+' ts '+ Date().substring(3,25);
                            var newOrderId2 = tradeId2+' ts '+ Date().substring(3,25);
                            var z;
                            newOrder['UserName'] = newOrder['user'];

                            newOrder['Qty'] = newOrder['quantity'];
                            newOrder['OrderType'] = newOrder['type'];
                            newOrder['Price'] = newOrder['price'];
                            if(i == oldOrder.length-1){
                                z = i;
                            }
                            else
                            {z = i-1;}

                            UpdatePersonalAccount([oldOrder[z],newOrder]);// For updating cash and stocks
                            //While deleting you have to update pending order to done
                            var update_p_query1 = 'Update '+db+'.local.U'+user1+'OrderBook SET [StateOfTxn] =\''+done+'\' ' +
                                ',OrderId = \''+newOrderId1+'\',TriggerPrice = \''+tradePrice+'\', leftover = 0,' +
                                'TriggerTime = SYSDATETIME() where orderid = \''+tradeId1+'\'';
                            request.query(update_p_query1,function(e,o){
                                if(e)
                                {
                                    console.log(e.message);
                                    console.log("State of TXN not changed2");
                                }
                            });

                            //While deleting you have to update pending order to done
                            var update_p_query2 = 'Update '+db+'.local.U'+user2+'OrderBook SET [StateOfTxn] =\''+done+'\' ' +
                                ',TriggerPrice = \''+tradePrice+'\',OrderId = \''+newOrderId2+'\', leftover = 0,' +
                                ' TriggerTime = SYSDATETIME() where orderid = \''+tradeId2+'\'';

                            request.query(update_p_query2,function(e,o){
                                if(e)
                                {
                                    console.log(e.message);
                                    console.log("State of TXN not changed3");
                                }
                            });

                            //tradeCompleted =1;
                            if(((toTrade = 0)|| (i=oldOrder.length))){
                                console.log("Trade completed @ "+tradePrice);
                                //No callback print stack trace there
                                UpdMinMax(delTable,newOrder);
                            }
                        }
                    });
                }
            });

        }

        toTrade = toTrade - tradeQuantity;
        i = i+1;
    }

};


var UpdMinMax= function(delTable,newOrder){
        // Should be called after all trades got completed so cannot call in else of delQuery,
        // will be called after completion of while loop if trade happens
        //callback(null);

        // Now we have to update MinMax table as MinS or MaxB may have changed
        console.log(delTable);
        var max,min;
        updateMinMax = 'SELECT min(price) MinMax FROM '+db+'.local.['+delTable+'] where company =\''+newOrder.stock+'\' and OrderType = \'sell\'' +
            ' Union SELECT max(price) FROM '+db+'.local.['+delTable+'] where company =\''+newOrder.stock+'\' and OrderType = \'buy\'';

        request.query(updateMinMax,function(e,o){
            console.log(o);
            if(e){
                console.log(e.message);
                console.log("New MinMax not selected");

            }


            else{
                if(o[0]['MinMax']==null){
                    min = 999;
                }
                else
                {
                    min = o[0]['MinMax'];
                }

                if(o[1]['MinMax']==null){
                    max = 0;
                }
                else
                {
                    max = o[1]['MinMax'];
                }

                var updateQuery = 'UPDATE '+db+'.global.[MinMax] SET [MinS] ='+min+' ,'+
                    '[MaxB] ='+max+' WHERE CompanyCode=\''+newOrder.stock+'\'';
                request.query(updateQuery,function(e,o){
                    if(e){
                        console.log(e.message);
                        console.log("MinMax not updated");
                    }
                    else
                    {   console.log("Min Max Updated");
                        ExtMinMax();
                    }
                });
                //console.log(o[1]['MinMax']);
            }
        })



};

function UpdatePersonalAccount(orders){
    console.log([orders,orders.length]);
    if(orders.length==1)
    {   var sel_query = 'Select TOP 1 * from '+db+'.local.U'+orders[0].UserName+'Stats order by EntryDate desc';

        request.query(sel_query,function(e,o){
            if(e){
                console.log(e.message);
                console.log("Recent Stat not selected for "+orders[0].UserName);
            }
            else
            {   var cash,sd;
                if(orders[0].OrderType=='buy')
                {
                    //vcash = o[0]['Cash']- (orders[0].Price*orders[0].Qty); Cash should be updated while placing order
                    cash = o[0]['Cash'];
                    sd = JSON.parse(o[0]['StockDetails']);
                    if((sd[orders[0].Stock]==undefined)||(sd[orders[0].Stock]=='undefined'))
                    {
                        sd[orders[0].Stock] = parseInt(orders[0].Qty);
                    }
                    else{
                        sd[orders[0].Stock] = parseInt(sd[orders[0].Stock]) + parseInt(orders[0].Qty);
                    }
                }
                else
                {
                    cash = parseFloat(o[0]['Cash'])+ parseFloat(orders[0].Price*orders[0].Qty);
                    sd = JSON.parse(o[0]['StockDetails']);
                    // sd[orders[0].Stock] = parseInt(sd[orders[0].Stock]) - parseInt(orders[0].Qty);
                    // stocks should be updated while placing order
                    sd[orders[0].Stock] = parseInt(sd[orders[0].Stock])
                }

                // Compute Current value of invested stocks
                getStockValue(sd,function(sharesWorth){
                    sd = JSON.stringify(sd);


                    var ins_query =  'INSERT INTO '+db+'.local.U'+orders[0].UserName+'Stats ([EntryDate],[Cash],SharesWorth,StockDetails)'+
                        'VALUES'+'(SYSDATETIME(),\''+cash+'\',\''+sharesWorth+'\',\''+sd+'\')';

                    updateUserStat(cash,sd,orders[0].UserName,sharesWorth);// To update stats in user table
                    request.query(ins_query,function(e){
                        if(e)
                        {
                            console.log(e.message);
                            console.log("Order not added to personal stat table");
                        }
                    });
                });


            }
        });


    }
    else
    {   orders[0]['Stock'] = orders[1]['stock'];
        orders[1]['Stock'] = orders[1]['stock'];
        orders.forEach(function(orders){

            var sel_query = 'Select TOP 1 * from '+db+'.local.U'+orders.UserName+'Stats order by EntryDate desc';
            request.query(sel_query,function(e,o){
                console.log(o);
                if(e){
                    console.log(e.message);
                    console.log("Latest data from stat not selected");
                }
                else
                {   var cash,sd;
                    if(orders.OrderType=='buy')
                    {
                        cash = o[0]['Cash']- (parseFloat(orders.Price)*parseInt(orders.Qty));
                        sd = JSON.parse(o[0]['StockDetails']);
                        //console.log(sd);
                        if((sd[orders.Stock]==undefined)||(sd[orders.Stock]=='undefined'))
                        {
                            sd[orders.Stock] = parseInt(orders.Qty);
                        }
                        else{
                            sd[orders.Stock] = parseInt(sd[orders.Stock]) + parseInt(orders.Qty);
                        }
                        //console.log([sd,parseInt(sd[orders.Stock]),parseInt(orders.Qty),orders.Stock,1]);
                    }
                    else
                    {

                        cash = o[0]['Cash']+ (parseFloat(orders.Price)*parseInt(orders.Qty));

                        sd = JSON.parse(o[0]['StockDetails']);
                        sd[orders.Stock] = parseInt(sd[orders.Stock]) - parseInt(orders.Qty);
                        //console.log(sd+"line");
                        //console.log([sd,parseInt(sd[orders.Stock]),parseInt(orders.Qty),orders.Stock]);


                    }

                    // Compute Current value of invested stocks
                    getStockValue(sd,function(sharesWorth){

                            sd = JSON.stringify(sd);


                            var ins_query =  'INSERT INTO '+db+'.local.U'+orders.UserName+'Stats ([EntryDate],[Cash],SharesWorth,StockDetails)'+
                                'VALUES'+'(SYSDATETIME(),\''+cash+'\',\''+sharesWorth+'\',\''+sd+'\')';

                            updateUserStat(cash,sd,orders.UserName,sharesWorth);// To update stats in user table
                            request.query(ins_query,function(e){
                                if(e)
                                {
                                    console.log(e.message);
                                    console.log("Stat not updated for "+orders.UserName);
                                }
                            });

                    });


                }
            });
        });
    }
}


function update_partial(orderToUpdate){

    var sel_query = 'Select * from '+db+'.local.U'+orderToUpdate.user+'OrderBook where OrderId = '+orderToUpdate.id;

    var update_personal = {};
    request.query(sel_query,function(e,o){
        if(e){
            console.log(e.message);
            console.log("Can not fetch data to update partial details");
        }
        else
        {   if(o.length>0) {
            update_personal['UserName'] = orderToUpdate.user;
            update_personal['OrderType'] = orderToUpdate.type;
            update_personal['Price'] = orderToUpdate.price; // Pricing is FIFO based
            update_personal['Qty'] = o[0]['leftover'] - orderToUpdate.leftover;
            update_personal['Stock'] = o[0]['CompanyCode'];
            UpdatePersonalAccount([update_personal]);

            var update_partial_query = 'Update ' + db + '.local.U' + orderToUpdate.user + 'OrderBook set leftover=' + orderToUpdate.leftover + 'where OrderId =\'' + orderToUpdate.id + '\'';
            request.query(update_partial_query, function (e) {
                if (e) {
                    console.log(e.message);
                    console.log("Can not update leftover for partial trade");
                }
            });
        }
        }
    });
}

function updateUserStat(cash,stockDetails,localUsername,localSharesWorth)
{
    // First update current worth of stocks
    var upd_query = 'Update '+db+'.global.UserDetails Set cash = '+cash+' , StockDetails = \''+stockDetails+'\' , SharesWorth = \''+localSharesWorth+'\' where UserName =\''+localUsername+'\'';
    console.log(upd_query);
    request.query(upd_query,function(e){
        if(e){
            console.log(e.message);
            console.log("Status not updated in User table for "+localUsername);
        }
    });
}

exports.addToWatchlist = function(userWatchlist,callback)
{
    var getCurrWatchlist = 'SELECT Watchlist FROM [global].[UserDetails] where username = \''+userWatchlist.username+'\'';

    request.query(getCurrWatchlist,function(e,o){
        if(e)
        {
            console.log(e.message);
            console.log("can not get current watchlist");
            callback(e);
        }
        else{
            currentWatchList = JSON.parse(o[0]['Watchlist']);
            currentWatchList[userWatchlist.comp] = userWatchlist.symbol ;
            currentWatchList = JSON.stringify(currentWatchList);
            console.log(currentWatchList);
            var upd_query = 'Update '+db+'.global.UserDetails Set Watchlist = \''+currentWatchList+'\' where UserName =\''+userWatchlist.username+'\'';

            request.query(upd_query,function(e){
                if(e){
                    console.log(e.message);
                    console.log("Watchlist not updated in User table for "+userWatchlist.username);
                    callback(e);
                }
                else{
                    callback(null);
                }
            });
        }
    });
};

function getStockValue(stockDetail,callback){
    //Fetch latest price from DB
    var sharesWorth = 0;
    var sel_query = 'Select TOP 1 * from '+db+'.global.CompanyStats where Price <> \'\' order by LogTime desc';

    request.query(sel_query,function(e,o){
        if(e)
        {
            console.log(e.message);
            console.log("Current prices can not be fetched");
        }
        else
        {   console.log(o[0]['Price']);
            var compStat = JSON.parse(o[0]['Price']);
            for(var i = 0; i < Object.keys(stockDetail).length; i++)
            {   console.log(compStat);
                console.log(stockDetail);
               sharesWorth = sharesWorth + compStat[Object.keys(stockDetail)[i].toUpperCase()].current*stockDetail[Object.keys(stockDetail)[i]] ;
            }

            callback(sharesWorth);
        }
    });


}