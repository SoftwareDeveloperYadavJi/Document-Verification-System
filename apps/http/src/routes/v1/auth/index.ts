import { Router } from "express";

export const authRouter : Router = Router();
import { register, login, resetPassword , resetPasswordVarification, getProfile } from "../../../controller/auth";
import { userAuth } from "../../../middleware/users";


authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/reset-password-verification', resetPasswordVarification);
authRouter.get('/me', userAuth, getProfile);
