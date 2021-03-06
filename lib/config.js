/*
 * Create and export configuration variables
 *
 */

// Container for all environments
const environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort' : process.env.PORT || 3000,
    'httpsPort' : process.env.PORT || 3000,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret'
};

// Testing environment
environments.testing = {
    'httpPort' : 4000,
    'httpsPort' : 4001,
    'envName' : 'testing',
    'hashingSecret' : 'thisIsASecret'
};

// Production environment
environments.production = {
    'httpPort' : process.env.PORT || 5000,
    'httpsPort' : process.env.PORT || 5000,
    'envName' : 'production',
    'hashingSecret' : 'thisIsAlsoASecret'
};

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
