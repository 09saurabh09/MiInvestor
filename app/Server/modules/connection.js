// This Module is for exporting the connection string to other modules
var sql = require('mssql');

/* establish the database connection */
var config = {
    user: 'sa',
    password: 'P@ssw0rd',
    server:'localhost', // You can use 'localhost\\instance' to connect to named instance
    database: 'MiInvestor',

    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
}


var connection = new sql.Connection(config, function(err) {
    // ... error checks

    if(err){
        console.log(" Not Connected")
        console.log(err.message)
    }

    else{console.log("Connected to Database")}

});
var request;
var db;
exports.request = new sql.Request(connection); // or: var request = connection.request();
exports.db = config.database;