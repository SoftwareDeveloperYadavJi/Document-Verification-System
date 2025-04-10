import { Router } from "express";
import {
    getAllTemplets,
    organizationKeyGeneration,
    templeteCreation
} from "../../../controller/issuers";
import { organizationAuth } from "../../../middleware/organization";

export const issuersRouter: Router = Router();

// Issuer related routes
issuersRouter.post("/generate-keys", organizationAuth, organizationKeyGeneration);
issuersRouter.post("/template", organizationAuth, templeteCreation);
issuersRouter.get("/templates", organizationAuth, getAllTemplets);