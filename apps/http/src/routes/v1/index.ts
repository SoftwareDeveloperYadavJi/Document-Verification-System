import { Router } from "express";
import { authRouter } from "./auth";
export const router : Router = Router();



router.use('/auth', authRouter);
// router.use('/organizations')
// router.use('/users')
// router.use('/issuers')
// router.use('/documents')
// router.use('/verify')
// router.use('/admin')
// router.use('/audit')