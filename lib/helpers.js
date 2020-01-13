/*
 * Helpers for some tasks
 *
 */

// Dependencies
const config = require('./config')
const crypto = require('crypto')

// Container for all the helpers
const helpers = {}

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = (str) => {
    try{
        const obj = JSON.parse(str)
        return obj
    } catch(e){
        return {}
    }
}

// Create a SHA256 hash
helpers.hash = (str) => {
    if(typeof(str) == 'string' && str.length > 0){
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
        return hash
    } else {
        return false
    }
}

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false
    if(strLength){
        // Define all the possible characters that could go into a string
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'

        // Start the final string
        let str = ''
        for(i = 1; i <= strLength; i++) {
            // Get a random charactert from the possibleCharacters string
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
            // Append this character to the string
            str+=randomCharacter
        }
        // Return the final string
        return str
    } else {
        return false
    }
}

// Return only base file name without dir
helpers.getMostRecentFileName = (dir) => {
        const files = fs.readdirSync(dir);

        // use underscore for max()
        return _.max(files, function (f) {
            var fullpath = path.join(dir, f);

            // ctime = creation time is used
            // replace with mtime for modification time
            return fs.statSync(fullpath).ctime;
        });
    }

// Validate Payload


// Export the module
module.exports = helpers