import { Router } from "express";

export const authRouter : Router = Router();
import { register, login } from "../../../controller/auth";


authRouter.post('/register', register);
authRouter.post('/login', login);