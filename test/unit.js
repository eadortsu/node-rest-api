/*
 * Unit Tests
 *
 */

// Dependencies
const helpers = require('./../lib/helpers.js')
const assert = require('assert')

// Holder for Tests
let unit = {}


// Assert that the getANumber function is returning a number
unit['helpers.getANumber should return a number'] = function(done){
    const val = helpers.getANumber()
    assert.equal(typeof(val), 'number')
    done()
}

// Assert that the getANumber function is returning 1
unit['helpers.getANumber should return 1'] = function(done){
    const val = helpers.getANumber()
    assert.equal(val, 1)
    done()
}


// Export the tests to the runner
module.exports = unit
