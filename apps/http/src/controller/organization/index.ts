import { Request, Response } from "express";
import { prisma } from "@repo/db/client"; 
import { StatusCodes } from "http-status-codes";
import jsonswebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OrganixationLoginSchema, OrganizationSchema } from "../../types";

export const Organizationregister = async (req : Request, res : Response) => {
    try {
        const organizationData = OrganizationSchema.safeParse(req.body);

        if (!organizationData.success) {
            console.log("Invalid organization data", organizationData.error);
             res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid organization data" });
             return;
        }

        const user = await prisma.organization.findUnique({
            where: {
                email: organizationData.data.email,
            },
        });


        if (user) {
             res.status(StatusCodes.BAD_REQUEST).json({ error: "Organization already exists" });
             return;
        }

        const newOrganization = await prisma.organization.create({
            data: {
                name: organizationData.data.name,
                password: await bcrypt.hashSync(organizationData.data.password, 10),
                description: organizationData.data.description,
                logoUrl: organizationData.data.logoUrl,
                website: organizationData.data.website,
                phoneNumber: organizationData.data.phoneNumber,
                email: organizationData.data.email,
                address: organizationData.data.address,
                city: organizationData.data.city,
                state: organizationData.data.state,
                zipCode: organizationData.data.zipCode,
                country: organizationData.data.country,
            },
            select: {
                name: true,
                description: true,
                website: true,
                email: true,
                phoneNumber: true,
                logoUrl: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
            }
        });

        res.status(StatusCodes.CREATED).json({ message: "Organization created successfully", organization: newOrganization });
        return;
    } catch (error) {
        console.log("Error occured while registering organization", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};


export const organizationLogin = async (req : Request, res : Response) => {
    try {
        
        const organizationSData = OrganixationLoginSchema.safeParse(req.body);

        if (!organizationSData.success) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid organization data" });
            return;
        }

        const user = await prisma.organization.findUnique({
            where: {
                email: organizationSData.data.email,
            },
        });

        if (!user) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Organization not found" });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(organizationSData.data.password, user.password);
        console.log(isPasswordCorrect);
        if (!isPasswordCorrect) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid credentials" });
            return;
        }

        const token = jsonswebtoken.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
            expiresIn: "1h",
        });

        res.status(StatusCodes.OK).json({ message: "Login successful", token });
        return;
        
    } catch (error) {
        console.log("Error occured while login user", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};

