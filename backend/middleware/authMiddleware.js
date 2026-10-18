// ============================================
// HerGuardian — Auth Middleware
// Technology: JWT (JSON Web Tokens)
// This protects private routes — only logged-in
// users can access them
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // JWT token is sent in the Authorization header
  // Format: "Bearer eyJhbGciOiJIUzI1NiIs..."
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify and decode the token using our secret key
      // If token is expired or tampered, this throws an error
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

      // Attach the user to request (minus password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Move to next middleware / route handler
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
