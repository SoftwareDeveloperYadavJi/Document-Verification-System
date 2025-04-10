import { prisma } from "@repo/db";
import * as crypto from "crypto";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createAuditLog } from "../../utils/audit";

/**
 * Verify a document by its ID
 * Public endpoint that doesn't require authentication
 */
export const verifyDocumentById = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Document ID is required',
        verified: false
      });
    }

    // Get document with related data
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        issuer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        organization: {
          select: { id: true, name: true, logoUrl: true, isVerified: true }
        },
        certificate: true
      }
    });

    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found',
        verified: false
      });
    }

    // Check if document is revoked
    if (document.isRevoked) {
      // Log verification attempt
      await createVerificationRecord(documentId, false, 'Document has been revoked', req);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Document has been revoked',
        verified: false,
        document: {
          id: document.id,
          title: document.title,
          issuedAt: document.createdAt,
          revokedAt: document.revokedAt,
          revokedReason: document.revokedReason
        }
      });
    }

    // Check if document is expired
    if (document.expiresAt && new Date() > document.expiresAt) {
      // Log verification attempt
      await createVerificationRecord(documentId, false, 'Document has expired', req);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Document has expired',
        verified: false,
        document: {
          id: document.id,
          title: document.title,
          issuedAt: document.createdAt,
          expiresAt: document.expiresAt
        }
      });
    }

    // Verify document signature if it exists
    let signatureValid = false;
    if (document.signature && document.certificate) {
      try {
        const publicKey = document.certificate.publicKey;
        const verify = crypto.createVerify('SHA256');
        verify.update(document.fileHash);
        signatureValid = verify.verify(publicKey, document.signature, 'base64');
      } catch (error) {
        console.error('Error verifying signature:', error);
        signatureValid = false;
      }
    }

    if (!signatureValid && document.signature) {
      // Log verification attempt
      await createVerificationRecord(documentId, false, 'Invalid document signature', req);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Document signature is invalid',
        verified: false,
        document: {
          id: document.id,
          title: document.title,
          issuedAt: document.createdAt
        }
      });
    }

    // Document is verified
    // Log verification attempt
    await createVerificationRecord(documentId, true, null, req);

    // Return verification result
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document verified successfully',
      verified: true,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        issuedAt: document.createdAt,
        signedAt: document.signedAt,
        expiresAt: document.expiresAt,
        issuer: document.issuer,
        organization: {
          id: document.organization.id,
          name: document.organization.name,
          logoUrl: document.organization.logoUrl,
          isVerified: document.organization.isVerified
        },
        signatureValid
      }
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to verify document',
      verified: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Verify a document by QR code data
 * Public endpoint that doesn't require authentication
 */
export const verifyDocumentByQR = async (req: Request, res: Response) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'QR code data is required',
        verified: false
      });
    }

    // Extract document ID from QR code data
    // QR code format: ${process.env.VERIFICATION_BASE_URL}/verify/${document.id}
    let documentId: string;
    try {
      const url = new URL(qrData);
      const pathParts = url.pathname.split('/');
      documentId = pathParts[pathParts.length - 1];
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid QR code data',
        verified: false
      });
    }

    // Redirect to document verification by ID
    req.params.documentId = documentId;
    return verifyDocumentById(req, res);
  } catch (error) {
    console.error('Error verifying document by QR:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to verify document by QR code',
      verified: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Verify a document by its hash
 * Public endpoint that doesn't require authentication
 */
export const verifyDocumentByHash = async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;

    if (!hash) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Document hash is required',
        verified: false
      });
    }

    // Find document by hash
    const document = await prisma.document.findUnique({
      where: { fileHash: hash },
      include: {
        issuer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        organization: {
          select: { id: true, name: true, logoUrl: true, isVerified: true }
        },
        certificate: true
      }
    });

    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'No document found with the provided hash',
        verified: false
      });
    }

    // Redirect to document verification by ID
    req.params.documentId = document.id;
    return verifyDocumentById(req, res);
  } catch (error) {
    console.error('Error verifying document by hash:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to verify document by hash',
      verified: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Check document status
 * Public endpoint that doesn't require authentication
 */
export const checkDocumentStatus = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    // Get document status
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        isRevoked: true,
        revokedAt: true,
        revokedReason: true,
        expiresAt: true,
        createdAt: true,
        signedAt: true,
        signature: true
      }
    });

    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Determine document status
    let status = 'VALID';
    let statusMessage = 'Document is valid';

    if (document.isRevoked) {
      status = 'REVOKED';
      statusMessage = `Document was revoked${document.revokedReason ? ` (Reason: ${document.revokedReason})` : ''}`;
    } else if (document.expiresAt && new Date() > document.expiresAt) {
      status = 'EXPIRED';
      statusMessage = 'Document has expired';
    } else if (!document.signature) {
      status = 'UNSIGNED';
      statusMessage = 'Document has not been signed';
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document status retrieved successfully',
      data: {
        id: document.id,
        title: document.title,
        status,
        statusMessage,
        isRevoked: document.isRevoked,
        revokedAt: document.revokedAt,
        revokedReason: document.revokedReason,
        expiresAt: document.expiresAt,
        createdAt: document.createdAt,
        signedAt: document.signedAt,
        isSigned: !!document.signature
      }
    });
  } catch (error) {
    console.error('Error checking document status:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to check document status',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Create a verification record
 * Helper function to log verification attempts
 */
const createVerificationRecord = async (documentId: string, isSuccessful: boolean, failReason: string | null, req: Request) => {
  try {
    await prisma.verification.create({
      data: {
        documentId,
        isSuccessful,
        failReason,
        verifierIp: req.ip,
        verifierInfo: {
          userAgent: req.headers['user-agent'],
          referer: req.headers.referer,
          method: req.method,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Also create an audit log
    await createAuditLog({
      documentId,
      action: isSuccessful ? 'DOCUMENT_VERIFIED_SUCCESS' : 'DOCUMENT_VERIFIED_FAILURE',
      details: { documentId, isSuccessful, failReason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    console.error('Error creating verification record:', error);
    // Don't throw error, just log it
  }
};
