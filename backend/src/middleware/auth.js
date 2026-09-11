const jwt = require('jsonwebtoken');
const { User } = require('../models');

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;

    // If role is missing in payload, attempt to look up from database
    if (!req.user.role && req.user.id) {
      try {
        const dbUser = await User.findByPk(req.user.id, { attributes: ['id', 'role', 'email'] });
        if (dbUser) {
          req.user.role = dbUser.role;
        }
      } catch (dbErr) {
        console.warn('verifyToken DB fallback lookup warning:', dbErr.message);
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const rawRole = (req.user.role || 'candidate').toString().toLowerCase().trim();
    const normalizedUserRole = (rawRole === 'seeker' || rawRole === 'candidate') ? 'candidate' : rawRole;

    const allowed = roles.some((r) => {
      const normalizedTarget = (r === 'seeker' || r === 'candidate') ? 'candidate' : String(r).toLowerCase().trim();
      return normalizedTarget === normalizedUserRole;
    });

    if (!allowed) {
      console.warn(`[403 FORBIDDEN] User ID ${req.user.id} with role '${req.user.role}' denied access to route requiring roles:`, roles);
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
};
