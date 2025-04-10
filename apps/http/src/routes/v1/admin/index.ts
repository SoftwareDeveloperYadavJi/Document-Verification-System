import { Router } from "express";
import { 
  getAllOrganizations,
  getAllOrganizationsWithUnverified
} from "../../../controller/admin";
import { authMiddleware } from "../../../middleware/auth";

export const adminRouter: Router = Router();

// Admin routes for organization management
adminRouter.get("/organizations/verified", authMiddleware, getAllOrganizations);
adminRouter.get("/organizations/unverified", authMiddleware, getAllOrganizationsWithUnverified);



