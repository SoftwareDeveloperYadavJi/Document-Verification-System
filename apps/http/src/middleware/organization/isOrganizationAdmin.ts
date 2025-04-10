import { prisma } from "@repo/db/client";
import { NextFunction, Response } from 'express';
import { ApiError } from '../../utils/errorhandlling';
import { AuthRequest } from '../auth';

/**
 * Middleware to check if user is an admin of the specified organization
 */
export const isOrganizationAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Check if user exists in request
        if (!req.user) {
            throw ApiError.unauthorized('User not authenticated');
        }

        const organizationId = req.params.id;

        if (!organizationId) {
            throw ApiError.badRequest('Organization ID is required');
        }

        // Check if user is a system admin (they can access any organization)
        if (req.user.roles.includes('SYSTEM_ADMIN')) {
            return next();
        }

        // Get user's email - first try from req.user, otherwise fetch from database
        let userEmail = req.user.email;

        if (!userEmail) {
            const user = await prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { email: true }
            });

            if (!user) {
                throw ApiError.notFound('User not found');
            }
            userEmail = user.email;
        }

        // Check if user is an organization admin
        const member = await prisma.organizationMember.findFirst({
            where: {
                organizationId,
                email: userEmail,
                role: 'ORGANIZATION_ADMIN'
            }
        });

        if (!member) {
            throw ApiError.forbidden('Access denied. Organization admin privileges required');
        }

        next();
    } catch (error) {
        next(error);
    }
};