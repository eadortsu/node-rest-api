const validator = {}

validator.isPresent = (str) => typeof (str) !== 'undefined'

validator.isString = (str) => typeof (str) == 'string'
validator.isBoolean = (str) => typeof (str) == 'boolean'
validator.isNumeric = (str) => {
    /*const numeric = /^[+-]?([0-9]*[.])?[0-9]+$/*/
    const numericNoSymbols = /^[0-9]+$/
    return numericNoSymbols.test(str);
}

validator.isNotEmpty = (str) =>  typeof (str) !== 'undefined' && str.trim().length > 0

validator.length = (str, min = 0, max ) => typeof (str) !== 'undefined' && str.length >= min && ( validator.isNumeric(max) === true ? str.length <= max : true )

validator.isEmail = (str) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(str).toLowerCase());
}

//Export the module
module.exports = validator
/*console.log(validator.length('','0','4'))*/
