/*
 * Primary file for API
 *
 */

// Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./lib/config');
const fs = require('fs');
const _data = require('./lib/data')
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')

//TESTING
//@TODO delete this
/*
_data.create('users','newFile',{'foo':'bar'},(err)=>console.log('this was the error', err))

_data.read('users','newFile',(err,data)=> console.log('this was data', data))


_data.update('users','newFile',{'fizz':'buzz'},(err)=> console.log('this was the error', err))

_data.delete('users','newFile',(err)=> console.log('this was the error', err))


 */

_data.readAll('eits',(err,data)=> {
    if(!err){
        console.log('this was data', data)
    }else{
        console.log(err)
    }
})


//console.log(helpers.getMostRecentFileName('eits'))





// Instantiate the HTTP Server
const httpServer = http.createServer((req, res) => {
 unifiedServer(req,res)
})

// Start the HTTP server
httpServer.listen(config.httpPort, () => console.log('The server is up and running on http://localhost:'+config.httpPort))

// Instantiate the HTTPS Server
const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsServerOptions,(req, res) => {
    unifiedServer(req,res)
})


//Start the HTTPS server
//httpsServer.listen(config.httpsPort, () => console.log('The server is up and running on https://localhost:'+config.httpsPort))


// All the server logic for both the http and https server
const unifiedServer = (req,res) =>{
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
        const chosenHandler = typeof (router[trimmedPath]) !== "undefined" ? router[trimmedPath] : handlers.notFound

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
            console.log("Returning this response: ", statusCode, payloadString);


        })
    })
}





//Define a request router
const router = {
    'users': handlers.users,
    'tokens': handlers.tokens,
    'eits': handlers.eits
}
