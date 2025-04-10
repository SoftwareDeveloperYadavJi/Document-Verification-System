import { Router } from "express";
import { authRouter } from "./auth";
import { organizationRouter } from "./organization";
import { issuersRouter } from "./issuers";
import { documentsRouter } from "./documents";
import { verifyRouter } from "./verify";
import { adminRouter } from "./admin";
import { auditRouter } from "./audit";
import { usersRouter } from "./users";

export const router: Router = Router();

router.use('/auth', authRouter);
router.use('/organizations', organizationRouter);
router.use('/users', usersRouter);
router.use('/issuers', issuersRouter);
router.use('/documents', documentsRouter);
router.use('/verify', verifyRouter);
router.use('/admin', adminRouter);
router.use('/audit', auditRouter);