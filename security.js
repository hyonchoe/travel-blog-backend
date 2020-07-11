const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
require('dotenv').config()

// Auth0 configuration
const isDev = (process.env.NODE_ENV !== 'production')
const domain = (isDev) ? process.env.AUTH0_DOMAIN : process.env.AUTH0_DOMAIN_PRD
const audience = (isDev) ? process.env.AUTH0_AUDIENCE : process.env.AUTH0_AUDIENCE_PRD
const authConfig = {
    issuer: `https://${domain}/`,
    audience: audience,
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