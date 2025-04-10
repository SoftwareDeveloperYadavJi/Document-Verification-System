import { Router } from "express";
import { forgotPassword, login, logout, refreshToken, register, resetPassword, verifyEmail } from "../../controller/auth";

export const authRouter: Router = Router();

// Authentication routes
authRouter.post('/login', login);
authRouter.post('/register', register);
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/refresh-token', refreshToken);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/logout', logout);