import { Request , Response , NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@repo/db/client";
import jsonwebtoken from "jsonwebtoken";


export const authVerifier = async (req: Request, res: Response, next: NextFunction) => {
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

        const verifier = await prisma.user.findUnique({
            where: {
                // @ts-ignore
                id: req.userId,
                roles:{
                    some:{
                        role: "VERIFIER"
                    }
                }
            },
        });
        

        if (!verifier) {
            res.status(StatusCodes.FORBIDDEN).json({ message: "Forbidden" });
            return;
        }
        
        next();

    } catch (error) {
        console.log("Error occured while validating verifier", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
}