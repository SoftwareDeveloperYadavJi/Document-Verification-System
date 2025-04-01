import { Router } from "express";

export const router : Router = Router();



router.use('/auth')
router.use('/organizations')
router.use('/users')
router.use('/issuers')
router.use('/documents')
router.use('/verify')
router.use('/admin')
router.use('/audit')