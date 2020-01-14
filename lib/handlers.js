// Dependencies
const _data = require('./data')
const helpers = require('./helpers')
const fs = require('fs')
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
                            callback(200, {"msg": "User Added", "user": userObject})
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
handlers._users.get = (data, callback) => {
    // Check that username number is valid
    const username = typeof (data.queryStringObject.username) == 'string' && data.queryStringObject.username.trim().length > 0 ? data.queryStringObject.username.trim() : false
    if (username) {
        //Get the token from the headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false

        //Verify that the givent token if valid for the username
        handlers._tokens.verifyToken(token, username, (tokenIsValid) => {
            if (tokenIsValid) {
                // Lookup the user
                _data.read('users', username, (err, data) => {
                    if (!err && data) {
                        // Remove the hashed password from the user user object before returning it to the requester
                        delete data.hashedPassword
                        callback(200, data)
                    } else {
                        callback(404, {'Error': 'User dose not exist'})
                    }
                })
            } else {
                callback(403, {'Error': 'Not Authenticated'})
            }
        })


    } else {
        callback(400, {'Error': 'Missing required field'})
    }
}

// Required data: username
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user up their object. Dont let them access update elses.
handlers._users.put = (data, callback) => {
    // Check for required field
    const username = typeof (data.payload.username) == 'string' && data.payload.username.trim().length > 0 ? data.payload.username.trim() : false

    // Check for optional fields
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
    const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

    // Error if username is invalid
    if (username) {
        // Error if nothing is sent to update
        //Get the token from the headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false

        //Verify that the givent token if valid for the username
        handlers._tokens.verifyToken(token, username, (tokenIsValid) => {
            if (tokenIsValid) {
                if (firstName || lastName || password) {
                    // Lookup the user
                    _data.read('users', username, (err, userData) => {
                        if (!err && userData) {
                            // Update the fields if necessary
                            if (firstName) {
                                userData.firstName = firstName
                            }
                            if (lastName) {
                                userData.lastName = lastName
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password)
                            }
                            // Store the new updates
                            _data.update('users', username, userData, (err) => {
                                if (!err) {
                                    delete userData.hashedPassword
                                    callback(200, {"msg": "User Info Updated", "user": userData})
                                } else {
                                    console.log(err)
                                    callback(500, {'Error': 'Could not update the user.'})
                                }
                            })
                        } else {
                            callback(400, {'Error': 'Specified user does not exist.'})
                        }
                    })
                } else {
                    callback(400, {'Error': 'Missing fields to update.'})
                }
            } else {
                callback(403, {'Error': 'Not Authenticated'})
            }
        })


    } else {
        callback(400, {'Error': 'Missing Username field.'})
    }

}

// Required data: username
// @TODO Only let an authenticated user delete their object. Dont let them delete update elses.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = (data, callback) => {
    // Check that username number is valid
    const username = typeof (data.queryStringObject.username) == 'string' && data.queryStringObject.username.trim().length > 0 ? data.queryStringObject.username.trim() : false
    if (username) {
        //Get the token from the headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false

        //Verify that the givent token if valid for the username
        handlers._tokens.verifyToken(token, username, (tokenIsValid) => {
            if (tokenIsValid) {
                // Lookup the user
                _data.read('users', username, (err, data) => {
                    if (!err && data) {
                        _data.delete('users', username, (err) => {
                            if (!err) {
                                callback(200, {'Msg': 'User Deleted'})
                            } else {
                                callback(500, {'Error': 'Could not delete the specified user'})
                            }
                        })
                    } else {
                        callback(400, {'Error': 'Could not find the specified user.'})
                    }
                })
            } else {
                callback(403, {'Error': 'Not Authenticated'})
            }
        })

    } else {
        callback(400, {'Error': 'Missing Username field'})
    }
}

// Tokens
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback)
    } else {
        callback(405)
    }
}

// Container for all the tokens methods
handlers._tokens = {}

// Tokens - post
// Required data: username, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
    const username = typeof (data.payload.username) == 'string' && data.payload.username.trim().length > 0 ? data.payload.username.trim() : false
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
    if (username && password) {
        // Lookup the user who matches that username number
        _data.read('users', username, (err, userData) => {
            if (!err && userData) {
                // Hash the sent password, and compare it to the password stored in the user object
                const hashedPassword = helpers.hash(password)
                if (hashedPassword === userData.hashedPassword) {
                    // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
                    const tokenId = helpers.createRandomString(20)
                    const expires = Date.now() + 1000 * 60 * 60
                    const tokenObject = {
                        'username': username,
                        'id': tokenId,
                        'expires': expires
                    }

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function (err) {
                        if (!err) {
                            callback(200, tokenObject)
                        } else {
                            callback(500, {'Error': 'Could not create the new token'})
                        }
                    })
                } else {
                    callback(400, {'Error': 'Password did not match the specified user\'s stored password'})
                }
            } else {
                callback(400, {'Error': 'Could not find the specified user.'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field(s).'})
    }
}

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = (data, callback) => {
    // Check that id is valid
    const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false
    if (id) {
        // Lookup the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData)
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field, or field invalid'})
    }
}

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
    const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false
    const extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend === true
    if (id && extend) {
        // Lookup the existing token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                // Check to make sure the token isn't already expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60
                    // Store the new updates
                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200, {'Msg': 'Token Extended'})
                        } else {
                            callback(500, {'Error': 'Could not update the token\'s expiration.'})
                        }
                    })
                } else {
                    callback(400, {"Error": "The token has already expired, and cannot be extended."})
                }
            } else {
                callback(400, {'Error': 'Specified user does not exist.'})
            }
        })
    } else {
        callback(400, {"Error": "Missing required field(s) or field(s) are invalid."})
    }
}


// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = (data, callback) => {
    // Check that id is valid
    const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
    if (id) {
        // Lookup the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                // Delete the token
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200, {'Msg': "Token Deleted"})
                    } else {
                        callback(500, {'Error': 'Could not delete the specified token'})
                    }
                })
            } else {
                callback(400, {'Error': 'Could not find the specified token.'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
}

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, username, callback) => {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            // Check that the token is for the given user and has not expired
            if (tokenData.username === username && tokenData.expires > Date.now()) {
                callback(true)
            } else {
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}

handlers._tokens.getCurrentUser = (id, callback) => {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            callback(tokenData.username)
        } else {
            callback(false)
        }
    })
}

//Eits
handlers.eits = (data, callback) => {

    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._eits[data.method](data, callback)
    } else {
        callback(405)
    }
}


//Container for the eits subMethods
handlers._eits = {}

// Eits - post
// Required data: firstName, lastName, username, password, tosAgreement
// Optional data: none
handlers._eits.post = (data, callback) => {
    //Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false
    if (!token) {
        callback(403, {'Error': 'Not Authenticated'})
    } else {
        //get the current user from token
        handlers._tokens.getCurrentUser(token, (currentUser) => {
            if (!currentUser) {
                callback(403, {'Error': 'Not Authenticated'})
            } else {
                // Check that all required fields are filled out
                const firstName = typeof (data.payload.firstName) == 'string' ? data.payload.firstName.trim() : ''
                const lastName = typeof (data.payload.lastName) == 'string' ? data.payload.lastName.trim() : ''
                const age = typeof (data.payload.age) == 'number' ? data.payload.age : ''
                const country = typeof (data.payload.country) == 'string' ? data.payload.country.trim() : ''

                const errors = {}
                if (firstName === '') {
                    errors.firstName = 'First name is Required'
                }
                if (lastName === '') {
                    errors.lastName = 'Last name is Required'

                }
                if (country === '') {
                    errors.country = 'Country is Required'
                }
                if (age === '') {
                    errors.age = 'Age is Required'
                } else if (age.toString().length > 2) {
                    errors.age = 'Invalid Age'
                }




                if (!Object.keys(errors).length) {
                    // Make sure the user doesnt already exist
                    let id = 0;
                   const lastEit = helpers.getMostRecentFileName('eits')
                    if(!lastEit){
                        id = 1
                    }else{
                         id = Number(lastEit.replace(/\.[^/.]+$/, "")) + 1
                    }
                    _data.read('eits', id, (err, data) => {
                        if (err) {

                            // Create the user object
                            const eitObject = {
                                'id': id,
                                'firstName': firstName,
                                'lastName': lastName,
                                'age': age,
                                'country': country,
                                'user': currentUser
                            }

                            // Store the user
                            _data.create('eits', id, eitObject, (err) => {
                                if (!err) {
                                    callback(200, {"msg": "Eit Added", "eit": eitObject})
                                } else {
                                    console.log(err)
                                    callback(500, {'Error': 'Could not Add Eit'})
                                }
                            })


                        } else {
                            // Eit already exists
                            callback(400, {'Error': 'An eit with that lastName and firstName already exists'})
                        }
                    })

                } else {
                    callback(400, {'Error': errors})
                }
            }
        })


    }
}

//Eits - get
// Required data: username
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let them access anyone elses.
handlers._eits.get = (data, callback) => {

                // Read all eits
                _data.readAll('eits', (err, data) => {
                    if (!err) {
                        callback(200,data)
                    } else {
                        // Eit already exists
                        callback(400, {'Error': err})
                    }
                })
}

// Required data: username
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user up their object. Dont let them access update elses.
handlers._eits.put = (data, callback) => {
    //Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false


    // Error if token is invalid
    if (token) {
        // Error if nothing is sent to update

        //get the current user from token
        handlers._tokens.getCurrentUser(token, (currentUser) => {
            if (!currentUser) {
                callback(403, {'Error': 'Not Authenticated'})
            } else {
                //Verify that the givent token if valid for the username
                const id = typeof (data.payload.id) == 'number' ? data.payload.id : false

                const firstName = typeof (data.payload.firstName) == 'string' ? data.payload.firstName.trim() : false
                const lastName = typeof (data.payload.lastName) == 'string' ? data.payload.lastName.trim() : false
                const age = typeof (data.payload.age) == 'number' ? data.payload.age : false
                const country = typeof (data.payload.country) == 'string' ? data.payload.country.trim() : false

                if(!id) {
                    callback(400, {'Error': 'Missing ID fields'})
                }else{
                    if (firstName || lastName || age || country) {
                        // Lookup the user
                        _data.read('eits', id, (err, eitData) => {
                            if (!err && eitData) {
                                if( currentUser === eitData.user) {
                                    // Update the fields if necessary
                                    if (firstName) {
                                        eitData.firstName = firstName
                                    }
                                    if (lastName) {
                                        eitData.lastName = lastName
                                    }
                                    if (age) {
                                        eitData.age = age
                                    }
                                    if (country) {
                                        eitData.country = country
                                    }
                                    // Store the new updates
                                    _data.update('eits', id, eitData, (err) => {
                                        if (!err) {
                                            callback(200, {"msg": "Eit Info Updated", "user": eitData})
                                        } else {
                                            console.log(err)
                                            callback(500, {'Error': 'Could not update the Eit.'})
                                        }
                                    })
                                }
                                else{
                                    callback(400, {'Error': 'You are not Authorized to delete this Eit.'})
                                }
                            } else {
                                callback(400, {'Error': 'Specified user does not exist.'})
                            }
                        })
                    } else {
                        callback(400, {'Error': 'Missing fields to update.'})
                    }
                }
            }
        })

    } else {
        callback(403, {'Error': 'Not Authenticated'})
    }

}

// Required data: username
// @TODO Only let an authenticated user delete their object. Dont let them delete update elses.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._eits.delete = (data, callback) => {
    //Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false


    // Error if token is invalid
    if (token) {
        // Error if nothing is sent to update

        //get the current user from token
        handlers._tokens.getCurrentUser(token, (currentUser) => {
            if (!currentUser) {
                callback(403, {'Error': 'Not Authenticated'})
            } else {
                //Verify that the givent token if valid for the username
                const id = typeof (data.payload.id) == 'number' ? data.payload.id : false


                if(!id) {
                    callback(400, {'Error': 'Missing ID fields'})
                }else{
                    // Lookup the user
                    _data.read('eits', id, (err, eitData) => {
                        if (!err && eitData) {

                            if( currentUser === eitData.user) {
                                // Delte Eit
                                _data.delete('eits', id, (err) => {
                                    if (!err) {
                                        callback(200, {'Msg': "EIT Deleted"})
                                    } else {
                                        callback(500, {'Error': 'Could not delete the specified Eit'})
                                    }
                                })
                            }else{
                                callback(400, {'Error': 'You are not Authorized to delete this Eit.'})
                            }

                        } else {
                            callback(400, {'Error': 'Specified user does not exist.'})
                        }
                    })
                }
            }
        })

    } else {
        callback(403, {'Error': 'Not Authenticated'})
    }

}


//not found handler
handlers.notFound = (data, callback) => {
    callback(404)
}


//Export the module
module.exports = handlers
