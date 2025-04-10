import { prisma } from "@repo/db/client";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jsonwebtoken from "jsonwebtoken";
import { OrganizationLoginSchema, OrganizationMemberSchema, OrganizationSchema, OrganizationUpdateSchema, createTemplateSchema } from "../../types";
import { createAuditLog } from "../../utils/audit";
import { sendOrganizationVerificationEmail } from "../../utils/email.user";
import { generateRandomPasswordWithLength } from "../../utils/randomPass";

// Custom type for extended Request with user property
interface AuthenticatedRequest extends Request {
    userId?: string;
    user?: {
        id: string;
    };
}

// Email utility class for organization-related emails
class Email {
    async addingMemberToOrganization(email: string, token: string, password: string, name: string) {
        // Implementation using sendEmailVerification or similar
        // For now, we're logging this as a placeholder
        console.log(`Would send email to ${email} with token ${token} and password ${password} for ${name}`);
        return true;
    }

    async organizationVerificationStatus(email: string, organizationName: string, status: string) {
        return await sendOrganizationVerificationEmail(email, organizationName, status);
    }
}

export const createOrganization = async (req: Request, res: Response) => {
    try {
        const organizationData = OrganizationSchema.safeParse(req.body);

        if (!organizationData.success) {
            console.log("Invalid organization data", organizationData.error);
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid organization data" });
            return;
        }

        const user = await prisma.organization.findUnique({
            where: {
                email: organizationData.data.email,
            },
        });

        if (user) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Organization already exists" });
            return;
        }

        const newOrganization = await prisma.organization.create({
            data: {
                name: organizationData.data.name,
                password: await bcrypt.hashSync(organizationData.data.password, 10),
                description: organizationData.data.description,
                logoUrl: organizationData.data.logoUrl,
                website: organizationData.data.website,
                phoneNumber: organizationData.data.phoneNumber,
                email: organizationData.data.email,
                address: organizationData.data.address,
                city: organizationData.data.city,
                state: organizationData.data.state,
                zipCode: organizationData.data.zipCode,
                country: organizationData.data.country,
            },
            select: {
                name: true,
                description: true,
                website: true,
                email: true,
                phoneNumber: true,
                logoUrl: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
            }
        });

        res.status(StatusCodes.CREATED).json({ message: "Organization created successfully", organization: newOrganization });
        return;
    } catch (error) {
        console.log("Error occured while registering organization", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};

export const organizationLogin = async (req: Request, res: Response) => {
    try {
        const organizationData = OrganizationLoginSchema.safeParse(req.body);

        if (!organizationData.success) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid organization data" });
            return;
        }

        const user = await prisma.organization.findUnique({
            where: {
                email: organizationData.data.email,
            },
        });

        if (!user) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Organization not found" });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(organizationData.data.password, user.password);
        console.log(isPasswordCorrect);
        if (!isPasswordCorrect) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid credentials" });
            return;
        }

        const token = jsonwebtoken.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
            expiresIn: "1h",
        });

        res.status(StatusCodes.OK).json({ message: "Login successful", token });
        return;

    } catch (error) {
        console.log("Error occured while login user", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};

export const addMemberToOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const organization = req.userId;

        if (!organization) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized access" });
            return;
        }

        const organizationData = OrganizationMemberSchema.safeParse(req.body);

        if (!organizationData.success) {
            console.log("Invalid organization data", organizationData.error);
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid organization data" });
            return;
        }

        const user = await prisma.organization.findUnique({
            where: {
                id: organization,
            },
        });

        if (!user) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Organization not found" });
            return;
        }

        const organizationMember = await prisma.organizationMember.findUnique({
            where: {
                email: organizationData.data.email,
            },
        });

        if (organizationMember) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Member already exists" });
            return;
        }

        const generatedPassword = generateRandomPasswordWithLength(10);
        const token = jsonwebtoken.sign({ userId: user.id, email: organizationData.data.email }, process.env.JWT_SECRET as string, {
            expiresIn: "1h",
        });

        const newMember = await prisma.organizationMember.create({
            data: {
                organizationId: organization,
                email: organizationData.data.email,
                name: organizationData.data.name,
                password: bcrypt.hashSync(generatedPassword, 10),
                pin: organizationData.data.pin,
                token: token,
                role: organizationData.data.role,
                invitedAt: new Date(),
                joinedAt: new Date(),
            },
            select: {
                email: true,
                pin: true,
                role: true,
                invitedAt: true,
                joinedAt: true,
            }
        });

        const email = new Email();
        await email.addingMemberToOrganization(organizationData.data.email, token, generatedPassword, organizationData.data.name);

        res.status(StatusCodes.CREATED).json({ message: "Member added successfully", member: newMember });
        return;
    } catch (error) {
        console.log("Error occured while adding member to organization", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};

export const changeMemberPassword = async (req: Request, res: Response) => {
    try {
        const token = req.query.token as string;
        const password = req.body.password as string;

        if (!token || !password) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Token and password are required" });
            return;
        }

        try {
            const verificationToken = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as {
                userId: string;
                email: string;
            };

            const organizationMember = await prisma.organizationMember.findFirst({
                where: {
                    token: token,
                    email: verificationToken.email,
                },
            });

            if (!organizationMember) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Organization member not found" });
                return;
            }

            const updateMember = await prisma.organizationMember.update({
                where: {
                    id: organizationMember.id,
                },
                data: {
                    password: bcrypt.hashSync(password, 10),
                    token: null,
                },
                select: {
                    email: true,
                    pin: true,
                    role: true,
                    invitedAt: true,
                    joinedAt: true,
                }
            });

            res.status(StatusCodes.OK).json({ message: "Password changed successfully", member: updateMember });
        } catch (error) {
            console.log("JWT verification error:", error);
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid or expired token" });
            return;
        }
    } catch (error) {
        console.log("Error occurred while changing member password", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const getOrganizationById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const organization = await prisma.organization.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                name: true,
                description: true,
                website: true,
                email: true,
                phoneNumber: true,
                logoUrl: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                isVerified: true,
                verifiedAt: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!organization) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Organization not found'
            });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Organization retrieved successfully',
            data: organization
        });
    } catch (error: any) {
        console.error('Error retrieving organization:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve organization',
            error: error?.message || 'Unknown error'
        });
    }
};

export const updateOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = OrganizationUpdateSchema.safeParse(req.body);

        if (!updateData.success) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Invalid organization data',
                errors: updateData.error.errors
            });
        }

        const organization = await prisma.organization.findUnique({
            where: { id }
        });

        if (!organization) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Check if user exists
        if (!req.user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const dataToUpdate = { ...updateData.data };
        if (dataToUpdate.password) {
            dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
        }

        const updatedOrganization = await prisma.organization.update({
            where: { id },
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                description: true,
                website: true,
                email: true,
                phoneNumber: true,
                logoUrl: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                isVerified: true,
                updatedAt: true
            }
        });

        await createAuditLog({
            userId: req.user.id,
            action: 'ORGANIZATION_UPDATED',
            details: { organizationId: id },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Organization updated successfully',
            data: updatedOrganization
        });
    } catch (error: any) {
        console.error('Error updating organization:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update organization',
            error: error?.message || 'Unknown error'
        });
    }
};

export const verifyOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Invalid verification status'
            });
        }

        const organization = await prisma.organization.findUnique({
            where: { id }
        });

        if (!organization) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Organization not found'
            });
        }

        if (!req.user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const updatedOrganization = await prisma.organization.update({
            where: { id },
            data: {
                isVerified: status === 'APPROVED',
                verifiedAt: status === 'APPROVED' ? new Date() : null,
                verifiedBy: req.user.id
            }
        });

        await prisma.verificationRequest.updateMany({
            where: {
                organizationId: id,
                status: 'PENDING'
            },
            data: {
                status,
                reviewerId: req.user.id,
                reviewedAt: new Date(),
                reviewNotes: notes
            }
        });

        await createAuditLog({
            userId: req.user.id,
            action: status === 'APPROVED' ? 'ORGANIZATION_VERIFIED' : 'ORGANIZATION_VERIFICATION_REJECTED',
            details: { organizationId: id, status, notes },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        const email = new Email();
        await email.organizationVerificationStatus(organization.email, organization.name, status);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `Organization ${status === 'APPROVED' ? 'verified' : 'rejected'} successfully`,
            data: {
                id: updatedOrganization.id,
                name: updatedOrganization.name,
                isVerified: updatedOrganization.isVerified,
                verifiedAt: updatedOrganization.verifiedAt
            }
        });
    } catch (error: any) {
        console.error('Error verifying organization:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to verify organization',
            error: error?.message || 'Unknown error'
        });
    }
};

export const getOrganizationMembers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const organization = await prisma.organization.findUnique({
            where: { id }
        });

        if (!organization) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Organization not found'
            });
        }

        const totalMembers = await prisma.organizationMember.count({
            where: { organizationId: id }
        });

        const members = await prisma.organizationMember.findMany({
            where: { organizationId: id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                invitedAt: true,
                joinedAt: true
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Organization members retrieved successfully',
            data: {
                members,
                pagination: {
                    total: totalMembers,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(totalMembers / Number(limit))
                }
            }
        });
    } catch (error: any) {
        console.error('Error retrieving organization members:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve organization members',
            error: error?.message || 'Unknown error'
        });
    }
};

export const updateOrganizationMember = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const { name, role, pin } = req.body;

        const organization = await prisma.organization.findUnique({
            where: { id }
        });

        if (!organization) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Organization not found'
            });
        }

        const member = await prisma.organizationMember.findFirst({
            where: {
                id: memberId,
                organizationId: id
            }
        });

        if (!member) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Member not found in organization'
            });
        }

        // Check if user exists
        if (!req.user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (pin) updateData.pin = pin;

        const updatedMember = await prisma.organizationMember.update({
            where: { id: memberId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                pin: true,
                invitedAt: true,
                joinedAt: true
            }
        });

        await createAuditLog({
            userId: req.user.id,
            action: 'ORGANIZATION_MEMBER_UPDATED',
            details: { organizationId: id, memberId },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Member updated successfully',
            data: updatedMember
        });
    } catch (error: any) {
        console.error('Error updating organization member:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update organization member',
            error: error?.message || 'Unknown error'
        });
    }
};

export const removeOrganizationMember = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id, memberId } = req.params;

        const organization = await prisma.organization.findUnique({
            where: { id }
        });

        if (!organization) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Organization not found'
            });
        }

        const member = await prisma.organizationMember.findFirst({
            where: {
                id: memberId,
                organizationId: id
            }
        });

        if (!member) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Member not found in organization'
            });
        }

        // Add null check for req.user
        if (!req.user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        await prisma.organizationMember.delete({
            where: { id: memberId }
        });

        await createAuditLog({
            userId: req.user.id,
            action: 'ORGANIZATION_MEMBER_REMOVED',
            details: { organizationId: id, memberId, memberEmail: member.email },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (error: any) {
        console.error('Error removing organization member:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to remove organization member',
            error: error?.message || 'Unknown error'
        });
    }
};

export const getOrganizationDocuments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        const organization = await prisma.organization.findUnique({
            where: { id }
        });

        if (!organization) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Organization not found'
            });
        }

        const filter: any = { organizationId: id };
        if (status === 'revoked') {
            filter.isRevoked = true;
        } else if (status === 'active') {
            filter.isRevoked = false;
        }

        const totalDocuments = await prisma.document.count({
            where: filter
        });

        const documents = await prisma.document.findMany({
            where: filter,
            select: {
                id: true,
                title: true,
                description: true,
                fileType: true,
                fileSize: true,
                signature: true,
                isRevoked: true,
                expiresAt: true,
                createdAt: true,
                signedAt: true,
                issuer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Organization documents retrieved successfully',
            data: {
                documents,
                pagination: {
                    total: totalDocuments,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(totalDocuments / Number(limit))
                }
            }
        });
    } catch (error: any) {
        console.error('Error retrieving organization documents:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve organization documents',
            error: error?.message || 'Unknown error'
        });
    }
};

export const getOrganizationTemplates = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        const organization = await prisma.organization.findUnique({
            where: { id }
        });

        if (!organization) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Organization not found'
            });
        }

        const filter: any = { organizationId: id };
        if (status === 'active') {
            filter.isActive = true;
        } else if (status === 'inactive') {
            filter.isActive = false;
        }

        const totalTemplates = await prisma.template.count({
            where: filter
        });

        const templates = await prisma.template.findMany({
            where: filter,
            select: {
                id: true,
                name: true,
                description: true,
                isActive: true,
                startDate: true,
                createdAt: true,
                updatedAt: true
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Organization templates retrieved successfully',
            data: {
                templates,
                pagination: {
                    total: totalTemplates,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(totalTemplates / Number(limit))
                }
            }
        });
    } catch (error: any) {
        console.error('Error retrieving organization templates:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve organization templates',
            error: error?.message || 'Unknown error'
        });
    }
};

export const createTemplate = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const templateData = createTemplateSchema.safeParse(req.body);

        if (!templateData.success) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Invalid template data',
                errors: templateData.error.errors
            });
        }

        const organization = await prisma.organization.findUnique({
            where: { id }
        });

        if (!organization) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Organization not found'
            });
        }

        if (!req.user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const existingTemplate = await prisma.template.findFirst({
            where: {
                organizationId: id,
                name: templateData.data.name
            }
        });

        if (existingTemplate) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: 'Template with this name already exists'
            });
        }

        // Create template with organizationId as non-optional string
        const template = await prisma.template.create({
            data: {
                organizationId: id as string, // Use type assertion to ensure it's a string
                name: templateData.data.name,
                description: templateData.data.description,
                startDate: templateData.data.startDate,
                isActive: true
            }
        });

        await createAuditLog({
            userId: req.user.id,
            action: 'TEMPLATE_CREATED',
            details: { templateId: template.id, organizationId: id },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Template created successfully',
            data: template
        });
    } catch (error: any) {
        console.error('Error creating template:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create template',
            error: error?.message || 'Unknown error'
        });
    }
};