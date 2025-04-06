import { Router } from "express";
import { organizationKeyGeneration, templeteCreation, getAllTemplets } from "../../../controller/issuers/index";
import { organizationAuth } from "../../../middleware/organization/index";
export const issuersRouter : Router = Router();


issuersRouter.post("/keypair", organizationAuth, organizationKeyGeneration);
issuersRouter.post('/createtemplete', organizationAuth , templeteCreation);
issuersRouter.get('/templets', organizationAuth , getAllTemplets);