import { prisma } from "@repo/db/client";
import { Request, Response } from "express";
import * as csv from 'fast-csv';
import * as fs from 'fs';
import { StatusCodes } from "http-status-codes";
import * as path from 'path';
import { getAuditLogs as getAuditLogsUtil } from "../../utils/audit";

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { userId, documentId, action, page = 1, limit = 20 } = req.query;

    const filters: any = {};
    if (userId) filters.userId = userId as string;
    if (documentId) filters.documentId = documentId as string;
    if (action) filters.action = action as string;

    const result = await getAuditLogsUtil(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    console.error("Error retrieving audit logs:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to retrieve audit logs"
    });
  }
};

/**
 * Get audit trail for a specific document
 */
export const getDocumentAuditTrail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Document not found"
      });
    }

    // Get audit logs for the document
    const auditLogs = await prisma.auditLog.findMany({
      where: { documentId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(StatusCodes.OK).json({ auditLogs });
  } catch (error) {
    console.error("Error retrieving document audit trail:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to retrieve document audit trail"
    });
  }
};

/**
 * Get activity logs for a specific user
 */
export const getUserActivityLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found"
      });
    }

    // Get audit logs for the user with pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId: id },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          document: {
            select: { id: true, title: true }
          }
        }
      }),
      prisma.auditLog.count({
        where: { userId: id }
      })
    ]);

    res.status(StatusCodes.OK).json({
      auditLogs,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error("Error retrieving user activity logs:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to retrieve user activity logs"
    });
  }
};

/**
 * Export audit logs as CSV
 */
export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const { userId, documentId, action, startDate, endDate } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;
    if (documentId) where.documentId = documentId as string;
    if (action) where.action = action as string;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        document: {
          select: { id: true, title: true }
        }
      }
    });

    // Create directory for exports if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'uploads', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Generate filename
    const filename = `audit_logs_${new Date().toISOString().replace(/:/g, '-')}.csv`;
    const filePath = path.join(exportsDir, filename);

    // Transform data for CSV
    const csvData = auditLogs.map(log => ({
      ID: log.id,
      Action: log.action,
      User: log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})` : 'N/A',
      Document: log.document ? log.document.title : 'N/A',
      Details: log.details ? JSON.stringify(log.details) : '',
      IPAddress: log.ipAddress || 'N/A',
      UserAgent: log.userAgent || 'N/A',
      Timestamp: log.createdAt.toISOString()
    }));

    // Create CSV file
    const csvStream = csv.format({ headers: true });
    const writeStream = fs.createWriteStream(filePath);

    csvStream.pipe(writeStream);
    csvData.forEach(row => csvStream.write(row));
    csvStream.end();

    // Wait for the file to be written
    await new Promise<void>((resolve) => {
      writeStream.on('finish', () => resolve());
    });

    // Send file as download
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: "Failed to download audit logs"
        });
      }

      // Clean up file after download
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to export audit logs"
    });
  }
};