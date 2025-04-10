import nodemailer from 'nodemailer';
import logger from './logger';

// Configure email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASSWORD || 'password'
    }
});

/**
 * Send email verification OTP to user
 */
export const sendEmailVerification = async (email: string, otp: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@docverification.com',
            to: email,
            subject: 'Verify Your Email for Document Verification System',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p>Thank you for registering with our Document Verification System. Please use the following OTP to verify your email address:</p>
                    <div style="background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
                        ${otp}
                    </div>
                    <p>This OTP will expire in 1 hour.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Email verification sent to ${email}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send verification email to ${email}`, error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Send password reset email to user
 */
export const sendPasswordResetEmail = async (email: string, token: string) => {
    try {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@docverification.com',
            to: email,
            subject: 'Reset Your Password for Document Verification System',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>We received a request to reset the password for your account. Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Your Password</a>
                    </div>
                    <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all; background-color: #f7f7f7; padding: 10px; border-radius: 5px;">${resetLink}</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send password reset email to ${email}`, error);
        throw new Error('Failed to send password reset email');
    }
};

/**
 * Send document verification success email
 */
export const sendDocumentVerificationEmail = async (email: string, documentTitle: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@docverification.com',
            to: email,
            subject: 'Document Verified Successfully',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #333;">Document Verification Successful</h2>
                    <p>Your document "${documentTitle}" has been verified successfully.</p>
                    <p>You can view the verified document in your account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/documents" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Document</a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Document verification email sent to ${email}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send document verification email to ${email}`, error);
        throw new Error('Failed to send document verification email');
    }
};

/**
 * Send document share notification email
 */
export const sendDocumentShareEmail = async (
    email: string,
    documentTitle: string,
    sharedByName: string,
    accessToken: string
) => {
    try {
        const viewLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/documents/shared?token=${accessToken}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@docverification.com',
            to: email,
            subject: 'Document Shared With You',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #333;">Document Shared With You</h2>
                    <p>${sharedByName} has shared a document with you: "${documentTitle}"</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${viewLink}" style="background-color: #2196F3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Document</a>
                    </div>
                    <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all; background-color: #f7f7f7; padding: 10px; border-radius: 5px;">${viewLink}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Document share email sent to ${email}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send document share email to ${email}`, error);
        throw new Error('Failed to send document share email');
    }
};

/**
 * Send organization verification completion email
 */
export const sendOrganizationVerificationEmail = async (
    email: string,
    organizationName: string,
    status: string
) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@docverification.com',
            to: email,
            subject: `Organization Verification ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #333;">Organization Verification ${status === 'APPROVED' ? 'Approved' : 'Rejected'}</h2>
                    <p>Your organization "${organizationName}" verification request has been ${status === 'APPROVED' ? 'approved' : 'rejected'}.</p>
                    ${status === 'APPROVED' ?
                    `<p>You can now start issuing documents through our platform.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/organization/dashboard" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                    </div>` :
                    `<p>Reason: ${status === 'REJECTED' ? 'Your organization did not meet our verification requirements.' : 'Your verification is still pending review.'}</p>
                    <p>If you have any questions, please contact our support team.</p>`
                }
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Organization verification email sent to ${email}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send organization verification email to ${email}`, error);
        throw new Error('Failed to send organization verification email');
    }
};