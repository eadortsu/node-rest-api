// Dependencies
const _data = require('./data')
const helpers = require('./helpers')

//Define the Handlers
const handlers = {}

//sample handler
handlers.sample = (data, callback) => {
// callback a http status code and a payload object
    callback(406, {'name': 'sample handler'})
}

//Users
handlers.users = (data, callback) => {

    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback)
    } else {
        callback(405)
    }
}

//Container for the users subMethods
handlers._users = {}

// Users - post
// Required data: firstName, lastName, username, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
// Check that all required fields are filled out
    const firstName = typeof (data.payload.firstName) == 'string' ? data.payload.firstName.trim() : ''
    const lastName = typeof (data.payload.lastName) == 'string' ? data.payload.lastName.trim() : ''
    const username = typeof (data.payload.username) == 'string' ? data.payload.username.trim() : ''
    const password = typeof (data.payload.password) == 'string' ? data.payload.password.trim() : ''
    const tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement === true

    const errors = {}
    if (firstName === '') {
        errors.firstName = 'First name is Required'
    }
    if (lastName === '') {
        errors.lastName = 'Last name is Required'

    }
    if (username === '') {
        errors.username = 'Username is Required'
    } else if (username.length < 4) {
        errors.username = 'Username must be more than four characters'
    }
    if (password === '') {
        errors.password = 'Password is Required'
    } else if (password.length < 6) {
        errors.password = 'Password must be more than six characters'
    }
    if (!tosAgreement) {
        errors.tosAgreement = 'Terms and Conditions must be agreed'
    }

    if (!Object.keys(errors).length) {
        // Make sure the user doesnt already exist
        _data.read('users', username, (err, data) => {
            if (err) {
                // Hash the password
                const hashedPassword = helpers.hash(password)

                // Create the user object
                if (hashedPassword) {
                    const userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'username': username,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    }

                    // Store the user
                    _data.create('users', username, userObject, (err) => {
                        if (!err) {
                            delete userObject.hashedPassword
                            callback(200, {"msg":"User Added", "user": userObject})
                        } else {
                            console.log(err)
                            callback(500, {'Error': 'Could not create the new user'})
                        }
                    })
                } else {
                    callback(500, {'Error': 'Could not hash the user\'s password.'})
                }

            } else {
                // User alread exists
                callback(400, {'Error': 'A user with that username number already exists'})
            }
        })

    } else {
        callback(400, {'Error': errors})
    }
}

//Users - get
// Required data: username
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let them access anyone elses.
handlers._users.get = (data,callback) => {
    // Check that username number is valid
    const username = typeof(data.queryStringObject.username) == 'string' && data.queryStringObject.username.trim().length > 0 ? data.queryStringObject.username.trim() : false
    if(username){
        // Lookup the user
        _data.read('users',username,(err,data) => {
            if(!err && data){
                // Remove the hashed password from the user user object before returning it to the requester
                delete data.hashedPassword
                callback(200,data)
            } else {
                callback(404,{'Error': 'User dose not exist'})
            }
        })
    } else {
        callback(400,{'Error' : 'Missing required field'})
    }
}

// Required data: username
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user up their object. Dont let them access update elses.
handlers._users.put = (data,callback) => {
    // Check for required field
    const username = typeof(data.payload.username) == 'string' && data.payload.username.trim().length > 0 ? data.payload.username.trim() : false

    // Check for optional fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

    // Error if username is invalid
    if(username){
        // Error if nothing is sent to update
        if(firstName || lastName || password){
            // Lookup the user
            _data.read('users',username,(err,userData) => {
                if(!err && userData){
                    // Update the fields if necessary
                    if(firstName){
                        userData.firstName = firstName
                    }
                    if(lastName){
                        userData.lastName = lastName
                    }
                    if(password){
                        userData.hashedPassword = helpers.hash(password)
                    }
                    // Store the new updates
                    _data.update('users',username,userData,(err) => {
                        if(!err){
                            delete userData.hashedPassword
                            callback(200, {"msg":"User Info Updated", "user": userData})
                        } else {
                            console.log(err)
                            callback(500,{'Error' : 'Could not update the user.'})
                        }
                    })
                } else {
                    callback(400,{'Error' : 'Specified user does not exist.'})
                }
            })
        } else {
            callback(400,{'Error' : 'Missing fields to update.'})
        }
    } else {
        callback(400,{'Error' : 'Missing Username field.'})
    }

}

// Required data: username
// @TODO Only let an authenticated user delete their object. Dont let them delete update elses.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = (data,callback) => {
    // Check that username number is valid
    const username = typeof(data.queryStringObject.username) == 'string' && data.queryStringObject.username.trim().length > 0 ? data.queryStringObject.username.trim() : false
    if(username){
        // Lookup the user
        _data.read('users',username,(err,data) => {
            if(!err && data){
                _data.delete('users',username,(err) => {
                    if(!err){
                        callback(200,{'Msg': 'User Deleted'})
                    } else {
                        callback(500,{'Error' : 'Could not delete the specified user'})
                    }
                })
            } else {
                callback(400,{'Error' : 'Could not find the specified user.'})
            }
        })
    } else {
        callback(400,{'Error' : 'Missing Username field'})
    }
}

//not found handler
handlers.notFound = (data, callback) => {
    callback(404)
}


//Export the module
module.exports = handlers
