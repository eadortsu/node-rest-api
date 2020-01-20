/*
 * Primary file for API
 *
 */

// Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config');
const fs = require('fs');
const _data = require('./data')
const handlers = require('./handlers')
const helpers = require('./helpers')

//TESTING
//@TODO delete this
/*
_data.create('users','newFile',{'foo':'bar'},(err)=>console.log('this was the error', err))

_data.read('users','newFile',(err,data)=> console.log('this was data', data))


_data.update('users','newFile',{'fizz':'buzz'},(err)=> console.log('this was the error', err))

_data.delete('users','newFile',(err)=> console.log('this was the error', err))




_data.readAll('eits',(err,data)=> {
    if(!err){
        console.log('this was data', data)
    }else{
        console.log(err)
    }
})


console.log(helpers.getMostRecentFileName('eits'))


*/


// Instantiate the server module object
const server = {};

// Instantiate the HTTP Server
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req,res)
})


// Instantiate the HTTPS Server
server.httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
}
server.httpsServer = https.createServer(server.httpsServerOptions,(req, res) => {
    server.unifiedServer(req,res)
})

// All the server logic for both the http and https server
server.unifiedServer = (req,res) =>{
// Parse the url
    const parsedUrl = url.parse(req.url, true)

// Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')

    //Get the query string as an object
    const queryStringObject = parsedUrl.query

    // Get the HTTP method
    const method = req.method.toLowerCase()
//Get the headers as an object
    const headers = req.headers

// Get the payload,if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => buffer += decoder.write(data))

    req.on('end', () => {
        buffer += decoder.end()

        //choose the handler this req should go to, if not found go to notfound handler
        const chosenHandler = typeof (server.router[trimmedPath]) !== "undefined" ? server.router[trimmedPath] : handlers.notFound

        // Construct the data object to send to the handler
        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {

            // Use the status code returned from the handler, or set the default status code to 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            // Use the payload returned from the handler, or set the default payload to an empty object
            payload = typeof (payload) == 'object' ? payload : {};

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            //console.log("Returning this response: ", statusCode, payloadString);


        })
    })
}


//Define a request router
server.router = {
    '': handlers.eits,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'eits': handlers.eits
}


// Init script
server.init = function(){
    // Start the HTTP server
    server.httpServer.listen(config.httpPort,function(){
        console.log('\x1b[36m%s\x1b[0m','The HTTP server is running on http://localhost:'+config.httpPort);
    });

    // Start the HTTPS server
    /*server.httpsServer.listen(config.httpsPort,function(){
        console.log('\x1b[35m%s\x1b[0m','The HTTPS server is running on port '+config.httpsPort);
    });*/
};

// Export the module
module.exports = server;
