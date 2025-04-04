import { Router } from "express";
import { Organizationregister, organizationLogin } from "../../../controller/organization";
export const organizationRouter : Router = Router();


organizationRouter.post("/register", Organizationregister);
organizationRouter.post("/login", organizationLogin);






