// Import jsonwebtoken for signing and verifying authorization tokens
const jwt = require('jsonwebtoken');

// Load the JWT signing secret from environmental variables
const JWT_SECRET = process.env.JWT_SECRET;
// Validate that the system has a signing secret configured
if (!JWT_SECRET) {
  // Prevent application startup if safety keys are missing
  throw new Error('JWT_SECRET environment variable is not set.');
}

// Define the middleware handler to authenticate incoming requests via bearer JWTs
const authenticate = (req, res, next) => {
  // Read the Authorization header value from the request
  const authHeader = req.headers.authorization;
  // Verify that the header exists and utilizes the Bearer schema
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Block the request with a 401 status if auth signatures are absent
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  // Split the header text by space to isolate the token string
  const token = authHeader.split(' ')[1];
  // Wrap token signature verification inside a try block to handle expiry/corruption
  try {
    // Validate the token string against our secret key, returning the decoded payload
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach the user metadata payload directly to the request object for downstream routes
    req.user = decoded;
    // Pass control to the next middleware or route handler in the chain
    next();
  } catch (error) {
    // Return a 401 status if verification fails due to expiration or signature tampering
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Define a role-based authorization check middleware creator
const authorize = (roles = []) => {
  // Normalize the roles argument into an array if it was passed as a single string
  if (typeof roles === 'string') {
    roles = [roles];
  }
  // Return the configured middleware handler
  return (req, res, next) => {
    // Verify that the user payload is present (authenticator must run first)
    if (!req.user) {
      // Reject request with a 401 if user context is missing
      return res.status(401).json({ error: 'Unauthorized. User context missing.' });
    }
    // Check if roles are specified and if the user's role is permitted
    if (roles.length && !roles.includes(req.user.role)) {
      // Return a 403 Forbidden status if the user's role is not authorized
      return res.status(403).json({ error: 'Forbidden. Requires role: ' + roles.join(' or ') });
    }
    // Pass control to the next handler if authorization check passes
    next();
  };
};

// Define a legacy admin-only authorization middleware handler
const authorizeAdminOnlyLegacy = (req, res, next) => {
  // Check if req.user context exists
  if (!req.user) {
    // Block requests with a 401 Unauthorized response
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  // Validate that the authenticated user possesses the specific ADMIN role
  if (req.user.role !== 'ADMIN') {
    // Return a 403 Forbidden response if roles mismatch
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  // Allow request to proceed to the database deletion handler
  next();
};

// Export the middleware modules for consumption in routes
module.exports = {
  authenticate,
  authorize,
  authorizeAdminOnlyLegacy,
};