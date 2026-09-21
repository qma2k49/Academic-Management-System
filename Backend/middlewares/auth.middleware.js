import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware to verify JWT Access Token from Authorization Header
 */
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied: No authentication token provided'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'academic_management_access_secret_key_2026');
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token'
        });
    }
};

/**
 * Middleware for Role-Based Access Control (RBAC)
 * @param {...string} allowedRoles - List of permitted user roles (e.g. 'ADMIN', 'OFFICER', 'LECTURER', 'STUDENT')
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: User role metadata not found'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied: Role '${req.user.role}' is not authorized to perform this action`
            });
        }

        next();
    };
};
