import { Router } from "express";
import { Organizationregister, organizationLogin , addMemberToOrganization, changeMemberPassword} from "../../../controller/organization";
import { organizationAuth } from "../../../middleware/organization/index";
export const organizationRouter : Router = Router();


organizationRouter.post("/register", Organizationregister);
organizationRouter.post("/login", organizationLogin);
organizationRouter.post("/add-member", organizationAuth, addMemberToOrganization);
organizationRouter.post("/change-password",  changeMemberPassword);






