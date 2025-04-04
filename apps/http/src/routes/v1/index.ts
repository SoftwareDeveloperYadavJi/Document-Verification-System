import { Router } from "express";
import { authRouter } from "./auth";
import { organizationRouter } from "./organization";
import { issuersRouter } from "./issuers";
export const router : Router = Router();



router.use('/auth', authRouter);
router.use('/auth/organizations', organizationRouter);
// router.use('/users')
router.use('/issuer', issuersRouter)
// router.use('/documents')
// router.use('/verify')
// router.use('/admin')
// router.use('/audit')