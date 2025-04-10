
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '@repo/db/client'; // Adjust the import based on your project structure
import { ApiError } from '../utils/errorhandlling';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extended Request interface to include user info
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email?: string;
        roles: string[];
    };
    userId?: string; // Adding this for backward compatibility
}

/**
 * Middleware to authenticate users
 */
export const authenticateUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        try {
            // First verify without type casting to ensure token is valid
            // @ts-ignore
            const decodedToken = jwt.verify(token, JWT_SECRET as string) as JwtPayload;

            if (!decodedToken || typeof decodedToken !== 'object') {
                throw ApiError.unauthorized('Invalid token format');
            }

            // Then extract the required fields with type safety
            const userId = decodedToken.userId as string;
            if (!userId) {
                throw ApiError.unauthorized('Token missing required userId field');
            }

            // Fetch user information including email if not in token
            let email = decodedToken.email as string | undefined;
            if (!email) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true }
                });

                if (user) {
                    email = user.email;
                }
            }

            // Extract roles from token with default empty array
            const roles = Array.isArray(decodedToken.roles) ? decodedToken.roles : [];

            // Attach user info to request
            req.user = {
                userId,
                email,
                roles
            };

            // Also set userId directly on req for backward compatibility
            req.userId = userId;

            next();
        } catch (error) {
            throw ApiError.unauthorized('Invalid or expired token');
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if user has a specific role
 */
export const hasRole = (role: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // Check if user exists in request
            if (!req.user) {
                throw ApiError.unauthorized('User not authenticated');
            }

            // Check if user has the required role
            if (!req.user.roles.includes(role)) {
                throw ApiError.forbidden('Access denied. Insufficient permissions');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware to check if user is a system admin
 */
export const isSystemAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Check if user exists in request
        if (!req.user) {
            throw ApiError.unauthorized('User not authenticated');
        }

        // Check if user has SYSTEM_ADMIN role
        if (!req.user.roles.includes('SYSTEM_ADMIN')) {
            throw ApiError.forbidden('Access denied. Admin privileges required');
        }

        next();
    } catch (error) {
        next(error);
    }
};