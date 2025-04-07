import { Request , Response } from "express";
import { prisma } from "@repo/db/client";
import { StatusCodes } from "http-status-codes";


export const getAllOrganizations = async (req: Request, res: Response) => {
    try {
        const organizations = await prisma.organization.findMany({
            where:{
                isVerified: true,
            }
        });
        if (!organizations) {
            res.status(StatusCodes.NOT_FOUND).json({ message: "No organizations found" });
            return;
        }
        res.status(StatusCodes.OK).json({ "All the organizations which is verified": organizations });
        return;
    } catch (error) {
        console.log("Error while fetching all organizations", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};



export const getAllOrganizationsWithUnverified = async (req: Request, res: Response) => {
    try {
        const organizations = await prisma.organization.findMany({
            where:{
                isVerified: false,
            }
        });
        if (!organizations) {
            res.status(StatusCodes.NOT_FOUND).json({ message: "No organizations found" });
            return;
        }
        res.status(StatusCodes.OK).json({ "All the organizations which is not verified": organizations });
        return;
    } catch (error) {
        console.log("Error while fetching all organizations", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};


