import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import logger from './logger';

// Create uploads directory if it doesn't exist
const qrCodeDir = path.join(process.cwd(), 'uploads', 'qrcodes');
if (!fs.existsSync(qrCodeDir)) {
  fs.mkdirSync(qrCodeDir, { recursive: true });
}

/**
 * Generate a QR code for document verification
 * @param documentId The ID of the document
 * @param verificationUrl The base URL for verification
 * @returns The URL to the QR code image
 */
export const generateDocumentQRCode = async (documentId: string, verificationUrl: string): Promise<string> => {
  try {
    // Create the verification link
    const verificationLink = `${verificationUrl}/verify/${documentId}`;

    // Generate a unique filename
    const filename = `doc_${documentId}_${Date.now()}.png`;
    const filePath = path.join(qrCodeDir, filename);

    // Generate QR code
    await QRCode.toFile(filePath, verificationLink, {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Return the URL to the QR code
    return `/uploads/qrcodes/${filename}`;
  } catch (error) {
    logger.error('Failed to generate QR code', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate a QR code as a data URL
 * @param data The data to encode in the QR code
 * @returns A data URL containing the QR code as a base64 encoded PNG
 */
export const generateQRCodeDataUrl = async (data: string): Promise<string> => {
  try {
    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return dataUrl;
  } catch (error) {
    logger.error('Failed to generate QR code data URL', error);
    throw new Error('Failed to generate QR code data URL');
  }
};

/**
 * Create a QR code for a URL
 * @param url The URL to encode in the QR code
 * @returns A data URL containing the QR code as a base64 encoded PNG
 */
export const createQRCode = async (url: string): Promise<string> => {
  return generateQRCodeDataUrl(url);
};