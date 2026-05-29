```js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Add it to your .env file.');
}

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // FIX: Removed ignoreExpiration — tokens now properly expire
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // FIX: No longer leaking error details to client
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Role authorization middleware
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. User context missing.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Requires role: ' + roles.join(' or ') });
    }

    next();
  };
};

// FIX: authorizeAdminOnlyLegacy now actually checks for ADMIN role
const authorizeAdminOnlyLegacy = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeAdminOnlyLegacy,
};






