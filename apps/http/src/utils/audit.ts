import { prisma } from '@repo/db/client';
import { logger } from './logger';

interface AuditLogData {
  userId?: string;
  documentId?: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 * @param data Audit log data
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    const { userId, documentId, action, details, ipAddress, userAgent } = data;

    await prisma.auditLog.create({
      data: {
        userId,
        documentId,
        action,
        details,
        ipAddress,
        userAgent
      }
    });

    logger.info(`Audit log created: ${action}`, {
      userId,
      documentId,
      action,
      ipAddress
    });
  } catch (error) {
    logger.error('Error creating audit log:', error);
    // Don't throw error, just log it
  }
};

/**
 * Get audit logs with filtering and pagination
 * @param filters Filters for audit logs
 * @param page Page number
 * @param limit Items per page
 */
export const getAuditLogs = async (
  filters: { userId?: string; documentId?: string; action?: string },
  page = 1,
  limit = 20
) => {
  try {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.documentId) where.documentId = filters.documentId;
    if (filters.action) where.action = filters.action;

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          document: {
            select: { id: true, title: true }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      auditLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error retrieving audit logs:', error);
    throw new Error('Failed to retrieve audit logs');
  }
};