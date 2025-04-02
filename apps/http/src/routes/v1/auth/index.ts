import { Router } from "express";

export const authRouter : Router = Router();
import { register, login, resetPassword , resetPasswordVarification } from "../../../controller/auth";


authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/reset-password-verification', resetPasswordVarification);
