import { prisma } from "@repo/db/client";
import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sendEmailVerification, sendPasswordResetEmail } from '../../utils/email.user';
import { ApiError } from '../../utils/errorhandlling';


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '1h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * User Login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Validate request
        if (!email || !password) {
            throw ApiError.badRequest('Email and password are required');
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                roles: true
            }
        });

        // Check if user exists
        if (!user) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        // Verify if email is verified
        if (!user.isEmailVerified) {
            throw ApiError.unauthorized('Email not verified. Please verify your email to continue');
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        // Generate access token
        const token = jwt.sign(
            {
                userId: user.id,
                roles: user.roles.map(role => role.role)
            },
            JWT_SECRET as string,
            { expiresIn: TOKEN_EXPIRY } as SignOptions
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { userId: user.id },
            JWT_SECRET as string,
            { expiresIn: REFRESH_TOKEN_EXPIRY } as SignOptions
        );

        // Create new session
        const session = await prisma.session.create({
            data: {
                userId: user.id,
                token: refreshToken,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'USER_LOGIN',
                details: { ip: req.ip, userAgent: req.headers['user-agent'] },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        // Return user data and tokens
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roles: user.roles.map(role => role.role)
                },
                accessToken: token,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * User Registration
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, firstName, lastName, phoneNumber } = req.body;

        // Validate request
        if (!email || !password) {
            throw ApiError.badRequest('Email and password are required');
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw ApiError.conflict('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP for email verification
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Create new user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phoneNumber,
                otp,
                roles: {
                    create: {
                        role: 'DOCUMENT_OWNER'
                    }
                }
            }
        });

        // Send verification email
        await sendEmailVerification(email, otp);

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'USER_REGISTERED',
                details: { ip: req.ip, userAgent: req.headers['user-agent'] },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email',
            data: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify Email
 */
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;

        // Validate request
        if (!email || !otp) {
            throw ApiError.badRequest('Email and OTP are required');
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Check if user exists
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // Check if email is already verified
        if (user.isEmailVerified) {
            return res.status(200).json({
                success: true,
                message: 'Email is already verified'
            });
        }

        // Check if OTP matches
        if (user.otp !== otp) {
            throw ApiError.badRequest('Invalid OTP');
        }

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                otp: null
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'EMAIL_VERIFIED',
                details: { ip: req.ip, userAgent: req.headers['user-agent'] },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Refresh Token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw ApiError.badRequest('Refresh token is required');
        }

        // Find session
        const session = await prisma.session.findUnique({
            where: { token: refreshToken }
        });

        if (!session) {
            throw ApiError.unauthorized('Invalid refresh token');
        }

        // Check if token is expired
        if (new Date() > session.expiresAt) {
            await prisma.session.delete({
                where: { id: session.id }
            });
            throw ApiError.unauthorized('Refresh token expired');
        }

        // Verify token
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { roles: true }
        });

        if (!user) {
            throw ApiError.unauthorized('User not found');
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            {
                userId: user.id,
                roles: user.roles.map(role => role.role)
            },
            JWT_SECRET as string,
            { expiresIn: TOKEN_EXPIRY } as SignOptions
        );

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Forgot Password
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw ApiError.badRequest('Email is required');
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if email exists or not for security
            return res.status(200).json({
                success: true,
                message: 'If your email is registered, you will receive a password reset link'
            });
        }

        // Generate token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create password reset record
        await prisma.passwordReset.create({
            data: {
                userId: user.id,
                token,
                expiresAt
            }
        });

        // Send password reset email
        await sendPasswordResetEmail(email, token);

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'PASSWORD_RESET_REQUESTED',
                details: { ip: req.ip, userAgent: req.headers['user-agent'] },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        res.status(200).json({
            success: true,
            message: 'If your email is registered, you will receive a password reset link'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset Password
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            throw ApiError.badRequest('Token and password are required');
        }

        // Find password reset request
        const passwordReset = await prisma.passwordReset.findUnique({
            where: { token }
        });

        if (!passwordReset) {
            throw ApiError.badRequest('Invalid or expired token');
        }

        // Check if token is expired
        if (new Date() > passwordReset.expiresAt || passwordReset.usedAt) {
            throw ApiError.badRequest('Token has expired');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        await prisma.user.update({
            where: { id: passwordReset.userId },
            data: {
                password: hashedPassword
            }
        });

        // Mark token as used
        await prisma.passwordReset.update({
            where: { id: passwordReset.id },
            data: { usedAt: true }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: passwordReset.userId,
                action: 'PASSWORD_RESET_COMPLETED',
                details: { ip: req.ip, userAgent: req.headers['user-agent'] },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout User
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw ApiError.badRequest('Refresh token is required');
        }

        // Delete session
        await prisma.session.deleteMany({
            where: { token: refreshToken }
        });

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        next(error);
    }
};