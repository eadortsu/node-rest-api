/*
 * API Tests
 *
 */

// Dependencies
const app = require('./../index');
const assert = require('assert');
const http = require('http');
const config = require('./../lib/config');

// Holder for Tests
const api = {};

// Helpers
const helpers = {};
helpers.makeGetRequest = (path,callback) =>{
    // Configure the request details
    const requestDetails = {
        'protocol' : 'http:',
        'hostname' : 'localhost',
        'port' : config.httpPort,
        'method' : 'GET',
        'path' : path,
        'headers' : {
            'Content-Type' : 'application/json'
        }
    };

    // Send the request
    const req = http.request(requestDetails,function(res){
        callback(res);
    });
    req.end();
};
helpers.makePostRequest = (path,body,callback) => {
    // Configure the request details
    const requestDetails = {
        'protocol' : 'http:',
        'hostname' : 'localhost',
        'port' : config.httpPort,
        'method' : 'POST',
        'path' : path,
        'headers' : {
            'Content-Type' : 'application/json'
        }
    };

    // Send the request
    const req = http.request(requestDetails,  (res) => {

        const chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function (chunk) {
            const body = Buffer.concat(chunks);
            //console.log(body.toString());
        });

        callback(res, JSON.stringify(body))
    });
    const postData = JSON.stringify(body);
    req.write(postData);
    req.end();
};

// The main init() function should be able to run without throwing.
api['app.init should start without throwing'] = (done) => {
    assert.doesNotThrow(() => {
        app.init((err) => {
            done();
        })
    },TypeError);
};


// Make a request to /api/users
api['/eits should respond to GET with 200'] = (done) => {
    helpers.makeGetRequest('/eits',(res) => {
        assert.equal(res.statusCode,200);
        done();
    });
};

// Make a request to /users
api['/users should respond to GET with 400'] = (done) =>{
    helpers.makeGetRequest('/users',(res) => {
        assert.equal(res.statusCode,400);
        done();
    });
};

// Make a request to /users
api['/users should respond to Post with 200'] = (done) =>{
    helpers.makePostRequest('/users',{"firstName":"tamtam","lastName":"tamtam","username":"tamtam","password":"123456","tosAgreement":true},(res,body) => {
        assert.equal(res.statusCode,200);
        console.log(body)
        assert.equal(body,'{"firstName":"tamtam","lastName":"tamtam","username":"tamtam","tosAgreement":true}');
        done();
    });
};

// Make a request to a random path
api['A random path should respond to GET with 404'] = function(done){
    helpers.makeGetRequest('/this/path/shouldnt/exist',function(res){
        assert.equal(res.statusCode,404);
        done();
    });
};

// Export the tests to the runner
module.exports = api;
