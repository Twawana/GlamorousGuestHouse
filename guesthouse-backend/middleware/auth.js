const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireStaffOrOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const allowedRoles = ['staff', 'owner', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Staff or owner privileges required.' });
  }
  
  next();
};

const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const allowedRoles = ['owner', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Owner privileges required.' });
  }
  
  next();
};

module.exports = {
  authenticate,
  requireStaffOrOwner,
  requireOwner
};