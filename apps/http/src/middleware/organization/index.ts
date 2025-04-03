import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import jsonwebtoken from "jsonwebtoken";
import { prisma } from "@repo/db/client";

export const organizationAuth = async (req: Request, res: Response, next: NextFunction) => {
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

        const user = await prisma.user.findUnique({
            where: {
                //@ts-ignore
                id: decodedToken.userId,
            },
            include: {
                roles: true,
            },
        });

        if (!user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
            return;
        }

        if (!user.roles?.[0]?.role) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
            return;
        }

        //@ts-ignore
        if (user.roles[0].role !== "admin") {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
            return;
        }
        
        next();
        return;
    } catch (error) {
        console.log("Error occured while validating organization", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};