import { prisma } from "@repo/db/client";
import * as crypto from "crypto";
import { Request, Response } from "express";
import * as fs from "fs";
import { StatusCodes } from "http-status-codes";
import * as path from "path";
import { createAuditLog } from "../../utils/audit";
import { sendNotification } from "../../utils/notification";
import { createQRCode } from "../../utils/qrcode";

// Extended Request type to include user property
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    roles: string[];
  };
}

// Error type for better error handling
interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    return new Error(String(maybeError));
  }
}

function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message;
}

/**
 * Create a new document
 */
export const createDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      fileUrl,
      fileType,
      fileSize,
      ownerId,
      organizationId,
      templateId,
      metadata,
      expiresAt
    } = req.body;

    // Get the issuer (current user)
    const issuerId = req.user.id;

    // Calculate file hash for integrity verification
    const fileBuffer = fs.readFileSync(path.resolve(fileUrl));
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Create the document
    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileUrl,
        fileHash,
        fileType,
        fileSize,
        issuerId,
        ownerId,
        organizationId,
        templateId,
        metadata,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }
    });

    // Generate QR code for verification
    const verificationUrl = `${process.env.VERIFICATION_BASE_URL}/verify/${document.id}`;
    const qrCodeUrl = await createQRCode(verificationUrl);

    // Update document with QR code URL
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: { qrCodeUrl }
    });

    // Create audit log
    await createAuditLog({
      userId: issuerId,
      documentId: document.id,
      action: 'DOCUMENT_CREATED',
      details: { documentId: document.id, title },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send notification to document owner
    await sendNotification({
      userId: ownerId,
      title: 'New Document Created',
      message: `A new document "${title}" has been created for you.`,
      type: 'DOCUMENT_CREATED'
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Document created successfully',
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to create document',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Get all documents (with filtering and pagination)
 */
export const getDocuments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      ownerId,
      issuerId,
      organizationId,
      isRevoked,
      search
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build filter conditions
    const where: any = {};

    if (ownerId) where.ownerId = ownerId as string;
    if (issuerId) where.issuerId = issuerId as string;
    if (organizationId) where.organizationId = organizationId as string;
    if (isRevoked !== undefined) where.isRevoked = isRevoked === 'true';

    // Search in title or description
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get documents with pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          issuer: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          organization: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.document.count({ where })
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Documents retrieved successfully',
      data: {
        documents,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve documents',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Get a single document by ID
 */
export const getDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        issuer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        organization: {
          select: { id: true, name: true, logoUrl: true }
        },
        certificate: true,
        template: true
      }
    });

    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Create audit log for document view
    await createAuditLog({
      userId: req.user.id,
      documentId: document.id,
      action: 'DOCUMENT_VIEWED',
      details: { documentId: document.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document retrieved successfully',
      data: document
    });
  } catch (error) {
    console.error('Error retrieving document:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve document',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Update a document
 */
export const updateDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      templateId,
      metadata,
      expiresAt
    } = req.body;

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id }
    });

    if (!existingDocument) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to update (issuer or admin)
    if (existingDocument.issuerId !== req.user.id && !req.user.roles.includes('SYSTEM_ADMIN')) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to update this document'
      });
    }

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        title,
        description,
        templateId,
        metadata,
        expiresAt: expiresAt ? new Date(expiresAt) : existingDocument.expiresAt
      }
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      documentId: id,
      action: 'DOCUMENT_UPDATED',
      details: { documentId: id, updates: req.body },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update document',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id }
    });

    if (!existingDocument) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to delete (issuer or admin)
    if (existingDocument.issuerId !== req.user.id && !req.user.roles.includes('SYSTEM_ADMIN')) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to delete this document'
      });
    }

    // Delete document
    await prisma.document.delete({
      where: { id }
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'DOCUMENT_DELETED',
      details: { documentId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete document',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Sign a document with digital signature
 */
export const signDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { certificateId } = req.body;

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to sign (issuer or admin)
    if (document.issuerId !== req.user.id && !req.user.roles.includes('SYSTEM_ADMIN')) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to sign this document'
      });
    }

    // Get certificate for signing
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId }
    });

    if (!certificate) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check if certificate is valid
    const now = new Date();
    if (now < certificate.validFrom || now > certificate.validUntil || certificate.isRevoked) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Certificate is not valid for signing'
      });
    }

    // Create signature using private key from certificate
    const privateKey = certificate.privateKey;
    const sign = crypto.createSign('SHA256');
    sign.update(document.fileHash);
    const signature = sign.sign(privateKey, 'base64');

    // Update document with signature and certificate
    const signedDocument = await prisma.document.update({
      where: { id },
      data: {
        signature,
        certificateId,
        signedAt: new Date()
      }
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      documentId: id,
      action: 'DOCUMENT_SIGNED',
      details: { documentId: id, certificateId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send notification to document owner
    await sendNotification({
      userId: document.ownerId,
      title: 'Document Signed',
      message: `Your document "${document.title}" has been digitally signed.`,
      type: 'DOCUMENT_SIGNED'
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document signed successfully',
      data: signedDocument
    });
  } catch (error) {
    console.error('Error signing document:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to sign document',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Revoke a document
 */
export const revokeDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to revoke (issuer or admin)
    if (document.issuerId !== req.user.id && !req.user.roles.includes('SYSTEM_ADMIN')) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to revoke this document'
      });
    }

    // Revoke document
    const revokedDocument = await prisma.document.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
      }
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      documentId: id,
      action: 'DOCUMENT_REVOKED',
      details: { documentId: id, reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send notification to document owner
    await sendNotification({
      userId: document.ownerId,
      title: 'Document Revoked',
      message: `Your document "${document.title}" has been revoked. Reason: ${reason}`,
      type: 'DOCUMENT_REVOKED'
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document revoked successfully',
      data: revokedDocument
    });
  } catch (error) {
    console.error('Error revoking document:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to revoke document',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Get document history (audit trail)
 */
export const getDocumentHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to view history
    if (document.ownerId !== req.user.id &&
      document.issuerId !== req.user.id &&
      !req.user.roles.includes('SYSTEM_ADMIN')) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to view this document history'
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Get audit logs for the document
    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { documentId: id },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      }),
      prisma.auditLog.count({ where: { documentId: id } })
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document history retrieved successfully',
      data: {
        auditLogs,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving document history:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve document history',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Create a sharing link for a document
 */
export const createShareLink = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { expiresAt, isOneTime } = req.body;

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to share (owner, issuer or admin)
    if (document.ownerId !== req.user.id &&
      document.issuerId !== req.user.id &&
      !req.user.roles.includes('SYSTEM_ADMIN')) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to share this document'
      });
    }

    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Create share link
    const shareLink = await prisma.documentShare.create({
      data: {
        document: { connect: { id } }, // Use connect pattern instead of documentId
        user: { connect: { id: req.user.id } }, // Use connect pattern for userId
        accessToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isOneTime: isOneTime || false
      }
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      documentId: id,
      action: 'DOCUMENT_SHARE_CREATED',
      details: { documentId: id, shareId: shareLink.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Generate full share URL
    const shareUrl = `${process.env.VERIFICATION_BASE_URL}/shared/${accessToken}`;

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Document share link created successfully',
      data: {
        ...shareLink,
        shareUrl
      }
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to create share link',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Delete a sharing link
 */
export const deleteShareLink = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, shareId } = req.params;

    // Check if share link exists
    const shareLink = await prisma.documentShare.findUnique({
      where: { id: shareId },
      include: { document: true }
    });

    if (!shareLink || shareLink.documentId !== id) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Share link not found'
      });
    }

    // Check if user has permission to delete share link
    if (shareLink.userId !== req.user.id &&
      shareLink.document.ownerId !== req.user.id &&
      shareLink.document.issuerId !== req.user.id &&
      !req.user.roles.includes('SYSTEM_ADMIN')) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to delete this share link'
      });
    }

    // Delete share link
    await prisma.documentShare.delete({
      where: { id: shareId }
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      documentId: id,
      action: 'DOCUMENT_SHARE_DELETED',
      details: { documentId: id, shareId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Share link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting share link:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete share link',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Batch document operations
 */
export const batchDocumentOperation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { operation, documentIds, data } = req.body;

    if (!operation || !documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid request parameters'
      });
    }

    // Validate operation type
    const validOperations = ['sign', 'revoke', 'delete'];
    if (!validOperations.includes(operation)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid operation type'
      });
    }

    // Check if user has permission for each document
    const documents = await prisma.document.findMany({
      where: { id: { in: documentIds } }
    });

    if (documents.length !== documentIds.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'One or more documents not found'
      });
    }

    // Filter documents based on user permissions
    const permittedDocuments = documents.filter(doc =>
      doc.issuerId === req.user.id || req.user.roles.includes('SYSTEM_ADMIN')
    );

    if (permittedDocuments.length !== documents.length) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission for one or more documents'
      });
    }

    // Perform batch operation
    let results: any[] = [];
    switch (operation) {
      case 'sign':
        if (!data.certificateId) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Certificate ID is required for signing'
          });
        }

        // Get certificate
        const certificate = await prisma.certificate.findUnique({
          where: { id: data.certificateId }
        });

        if (!certificate) {
          return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'Certificate not found'
          });
        }

        // Sign each document
        results = await Promise.all(documentIds.map(async (docId) => {
          const doc = documents.find(d => d.id === docId);

          if (!doc) {
            throw new Error(`Document with ID ${docId} not found`);
          }

          // Create signature
          const privateKey = certificate.privateKey;
          const sign = crypto.createSign('SHA256');
          sign.update(doc.fileHash);
          const signature = sign.sign(privateKey, 'base64');

          // Update document
          const signedDoc = await prisma.document.update({
            where: { id: docId },
            data: {
              signature,
              certificateId: data.certificateId,
              signedAt: new Date()
            }
          });

          // Create audit log
          await createAuditLog({
            userId: req.user.id,
            documentId: docId,
            action: 'DOCUMENT_SIGNED_BATCH',
            details: { documentId: docId, certificateId: data.certificateId },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });

          return signedDoc;
        }));
        break;

      case 'revoke':
        // Revoke each document
        results = await Promise.all(documentIds.map(async (docId) => {
          const revokedDoc = await prisma.document.update({
            where: { id: docId },
            data: {
              isRevoked: true,
              revokedAt: new Date(),
              revokedReason: data.reason || 'Batch revocation'
            }
          });

          // Create audit log
          await createAuditLog({
            userId: req.user.id,
            documentId: docId,
            action: 'DOCUMENT_REVOKED_BATCH',
            details: { documentId: docId, reason: data.reason },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });

          return revokedDoc;
        }));
        break;

      case 'delete':
        // Delete each document
        results = await Promise.all(documentIds.map(async (docId) => {
          await prisma.document.delete({
            where: { id: docId }
          });

          // Create audit log
          await createAuditLog({
            userId: req.user.id,
            action: 'DOCUMENT_DELETED_BATCH',
            details: { documentId: docId },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });

          return { id: docId, deleted: true };
        }));
        break;
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Batch ${operation} operation completed successfully`,
      data: {
        operation,
        count: results.length,
        results
      }
    });
  } catch (error) {
    console.error(`Error in batch document operation:`, error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to perform batch operation',
      error: getErrorMessage(error)
    });
  }
};
