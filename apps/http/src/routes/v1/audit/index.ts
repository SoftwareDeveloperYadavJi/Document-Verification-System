import { Router } from "express";
import {
  exportAuditLogs,
  getAuditLogs,
  getDocumentAuditTrail,
  getUserActivityLogs
} from "../../../controller/audit";
import { authMiddleware } from "../../../middleware/auth";

export const auditRouter: Router = Router();

// Audit routes
auditRouter.get("/logs", authMiddleware, getAuditLogs);
auditRouter.get("/document/:id", authMiddleware, getDocumentAuditTrail);
auditRouter.get("/user/:id", authMiddleware, getUserActivityLogs);
auditRouter.get("/export", authMiddleware, exportAuditLogs);
