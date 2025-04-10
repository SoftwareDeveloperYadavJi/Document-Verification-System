import { Router } from "express";
import {
  batchDocumentOperation,
  createDocument,
  createShareLink,
  deleteDocument,
  deleteShareLink,
  getDocument,
  getDocumentHistory,
  getDocuments,
  revokeDocument,
  signDocument,
  updateDocument
} from "../../../controller/documents";
import { authMiddleware } from "../../../middleware/auth";

export const documentsRouter: Router = Router();

// Document management routes
documentsRouter.post("/", authMiddleware, createDocument);
documentsRouter.get("/", authMiddleware, getDocuments);
documentsRouter.get("/:id", authMiddleware, getDocument);
documentsRouter.put("/:id", authMiddleware, updateDocument);
documentsRouter.delete("/:id", authMiddleware, deleteDocument);

// Document operations
documentsRouter.post("/:id/sign", authMiddleware, signDocument);
documentsRouter.post("/:id/revoke", authMiddleware, revokeDocument);
documentsRouter.get("/:id/history", authMiddleware, getDocumentHistory);

// Document sharing
documentsRouter.post("/:id/share", authMiddleware, createShareLink);
documentsRouter.delete("/:id/share/:shareId", authMiddleware, deleteShareLink);

// Batch operations
documentsRouter.post("/batch", authMiddleware, batchDocumentOperation);
