import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import jsonwebtoken from "jsonwebtoken";
import { prisma } from "@repo/db/client";

export const userAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
            return;
        }

        const decodedToken = jsonwebtoken.verify(token, process.env.JWT_SECRET as string);
        if (!decodedToken) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
            return;
        }

        //@ts-ignore
        req.user = decodedToken.userId;

        next();
        return;
    } catch (error) {
        console.log("Error occured while validating user", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};