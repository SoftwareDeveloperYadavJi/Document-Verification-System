import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import jsonwebtoken from "jsonwebtoken";

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

        // @ts-ignore
        req.userId = decodedToken.userId;

        
        next();

    } catch (error) {
        console.log("Error occured while validating organization", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};

