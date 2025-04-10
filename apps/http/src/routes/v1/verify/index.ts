import { Router } from "express";
import {
  checkDocumentStatus,
  verifyDocumentByHash,
  verifyDocumentById,
  verifyDocumentByQR
} from "../../../controller/verfiy";

export const verifyRouter: Router = Router();

// Public verification endpoints (no authentication required)
verifyRouter.get("/document/:documentId", verifyDocumentById);
verifyRouter.post("/qr", verifyDocumentByQR);
verifyRouter.get("/hash/:hash", verifyDocumentByHash);
verifyRouter.get("/status/:documentId", checkDocumentStatus);
