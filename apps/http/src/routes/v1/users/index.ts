import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth";

export const usersRouter: Router = Router();

// Basic user routes structure
// These routes will be implemented when the controller functions are available
usersRouter.get("/profile", authMiddleware);
usersRouter.put("/profile", authMiddleware);
usersRouter.get("/documents", authMiddleware);
usersRouter.get("/notifications", authMiddleware);