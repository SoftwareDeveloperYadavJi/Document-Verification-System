import { Router } from "express";
import {
    addMemberToOrganization,
    createOrganization,
    createTemplate,
    getOrganizationById,
    getOrganizationDocuments,
    getOrganizationMembers,
    getOrganizationTemplates,
    removeOrganizationMember,
    updateOrganization,
    updateOrganizationMember,
    verifyOrganization
} from "../../controller/organization";
import { authenticateUser } from "../../middleware/auth";
import { isOrganizationAdmin } from "../../middleware/organization/isOrganizationAdmin";

export const organizationRouter: Router = Router();

// Public routes
organizationRouter.post('/', createOrganization);

// Protected routes
organizationRouter.get('/:id', authenticateUser, getOrganizationById);
organizationRouter.put('/:id', authenticateUser, isOrganizationAdmin, updateOrganization);

// Organization verification
organizationRouter.post('/:id/verify', authenticateUser, verifyOrganization);

// Organization members management
organizationRouter.get('/:id/members', authenticateUser, isOrganizationAdmin, getOrganizationMembers);
organizationRouter.post('/:id/members', authenticateUser, isOrganizationAdmin, addMemberToOrganization);
organizationRouter.put('/:id/members/:memberId', authenticateUser, isOrganizationAdmin, updateOrganizationMember);
organizationRouter.delete('/:id/members/:memberId', authenticateUser, isOrganizationAdmin, removeOrganizationMember);

// Organization documents
organizationRouter.get('/:id/documents', authenticateUser, isOrganizationAdmin, getOrganizationDocuments);

// Organization templates
organizationRouter.get('/:id/templates', authenticateUser, isOrganizationAdmin, getOrganizationTemplates);
organizationRouter.post('/:id/templates', authenticateUser, isOrganizationAdmin, createTemplate);