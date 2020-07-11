const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
require('dotenv').config()

// Auth0 configuration
const authConfig = {
    issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE,
    algorithms: ['RS256'],
};

// Dynamically provide a signing key
// based on the kid in the header and 
// the signing keys provided by the JWKS endpoint.
const secret = jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${authConfig.issuer}.well-known/jwks.json`,
});

// Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({ secret, ...authConfig });

module.exports = { checkJwt };