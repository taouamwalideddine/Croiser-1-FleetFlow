// core imports
import jwt from 'jsonwebtoken';

// middleware to verify jwt token
// adds user info to request if valid
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header must be in format: Bearer <token>'
      });
    }
    

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};


// middleware to check for admin role
// must be used after authenticate
export const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
};

/**
 * Middleware to check if user has chauffeur role.
 * Must be used after authenticate middleware.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authorizeChauffeur = (req, res, next) => {
  if (req.user && req.user.role === 'chauffeur') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Chauffeur role required.'
    });
  }
};


