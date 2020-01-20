/*
 * Primary file for API
 *
 */

// Dependencies
const server = require('./lib/server');


// Declare the app
const app = {};

// Init function
app.init = function(callback){

    // Start the server
    server.init();

    callback()
};

// Self invoking only if required directly
if(require.main === module){
    app.init(()=>{});
}


// Export the app
module.exports = app;
