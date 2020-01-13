/*
 * Library for storing and editing data
 *
 */

// Dependencies
const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')

// Container for module (to be exported)
const lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname, '/../.data/')

// Write data to a file
lib.create = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Convert data to string
            const stringData = JSON.stringify(data)

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false)
                        } else {
                            callback('Error closing new file')
                        }
                    });
                } else {
                    callback('Error writing to new file')
                }
            })
        } else {
            callback('Could not create new file, it may already exist')
        }
    });

};

// Read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
        if (!err && data) {
            const parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    });
};


lib.readAll = (dir, callback) => {
    const allData = {};
    fs.readdir(lib.baseDir + dir, (err, filenames) => {

        if (!err) {

            filenames.forEach((filename) => {
                lib.read( dir, filename.replace(/\.[^/.]+$/, ""), (err, data) => {
                    if (!err) {
                        allData[filename.replace(/\.[^/.]+$/, "")] = data

                    } else {
                        callback(400, {'Error': data})
                    }

                })
            })

          // allData =  filenames.map((filename) =>  filename.replace(/\.[^/.]+$/, ""))
            const parsedData = helpers.parseJsonToObject(allData);
            callback(false,parsedData)

        } else {
            callback(400, {'Error': err})
        }
    })
};


// Update data in a file
lib.update = (dir, file, data, callback) => {

    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Convert data to string
            const stringData = JSON.stringify(data);

            // Truncate the file
            fs.truncate(fileDescriptor, (err) => {
                if (!err) {
                    // Write to file and close it
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDescriptor, (err) => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing existing file');
                                }
                            });
                        } else {
                            callback('Error writing to existing file');
                        }
                    });
                } else {
                    callback('Error truncating file');
                }
            });
        } else {
            callback('Could not open file for updating, it may not exist yet');
        }
    });

};

// Delete a file
lib.delete = (dir, file, callback) => {

    // Open the file for writing
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        }
    });


};


// Export the module
module.exports = lib;

