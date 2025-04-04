import { Router } from "express";
import { organizationKeyGeneration } from "../../../controller/issuers/index";
import { organizationAuth } from "../../../middleware/organization/index";
export const issuersRouter : Router = Router();


issuersRouter.post("/keypair", organizationAuth, organizationKeyGeneration);