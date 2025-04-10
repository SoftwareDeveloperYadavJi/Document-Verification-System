import { Router } from "express";
import {
    Organizationregister,
    addMemberToOrganization,
    changeMemberPassword,
    createTemplate,
    getOrganizationById,
    getOrganizationDocuments,
    getOrganizationMembers,
    getOrganizationTemplates,
    organizationLogin,
    removeOrganizationMember,
    updateOrganization,
    updateOrganizationMember,
    verifyOrganization
} from "../../../controller/organization";
import { organizationAuth } from "../../../middleware/organization/index";
export const organizationRouter: Router = Router();

// Authentication routes
organizationRouter.post("/register", Organizationregister);
organizationRouter.post("/login", organizationLogin);
organizationRouter.post("/change-password", changeMemberPassword);

// Organization management routes
organizationRouter.get("/:id", getOrganizationById);
organizationRouter.put("/:id", organizationAuth, updateOrganization);
organizationRouter.post("/:id/verify", organizationAuth, verifyOrganization);

// Organization member management routes
organizationRouter.post("/add-member", organizationAuth, addMemberToOrganization);
organizationRouter.get("/:id/members", organizationAuth, getOrganizationMembers);
organizationRouter.put("/:id/members/:memberId", organizationAuth, updateOrganizationMember);
organizationRouter.delete("/:id/members/:memberId", organizationAuth, removeOrganizationMember);

// Organization document management routes
organizationRouter.get("/:id/documents", organizationAuth, getOrganizationDocuments);

// Organization template management routes
organizationRouter.get("/:id/templates", organizationAuth, getOrganizationTemplates);
organizationRouter.post("/:id/templates", organizationAuth, createTemplate);






