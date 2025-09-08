import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwtUtils';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authMiddleware = {
  authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const decoded = JWTUtils.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  },

  requireRole: (roles: string | string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userRole = req.user.role;
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  },

  optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = JWTUtils.verifyToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid but we continue without user context
        console.log('Optional auth: Invalid token, continuing without user context');
      }
    }

    next();
  }
};