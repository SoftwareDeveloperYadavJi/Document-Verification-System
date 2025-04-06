import { Request, Response } from "express";
import { prisma } from "@repo/db/client";
import { StatusCodes } from "http-status-codes";
import { generateKeyPairSync, createSign } from "crypto"
import { createTemplateSchema } from "../../types";

export const organizationKeyGeneration = async (req: Request, res: Response) => {
    try {
        //@ts-ignore
        const userId = req.userId;

        const user = await prisma.organization.findUnique({
            where: {
                id: userId
            }
        });


        if (!user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ massage: "User not found" });
            return;
        }

        const { privateKey, publicKey } = generateKeyPairSync("rsa", {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: "spki",
                format: "pem"
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem",
                //cipher: "aes-256-cbc",
                //passphrase: "password"
            }
        });
     
        await prisma.keyPair.create({
            data: {
                organizationId: userId,
                name: "Default",
                publicKey: publicKey,
                privateKey: privateKey,
                algorithm: "RSA",
                keySize: 4096,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });


        res.status(StatusCodes.CREATED).json({ massage: "Key pair created successfully" });
        return;

    } catch (error) {
        console.log("Error while Creation of keys", error);
        res.status(500).json({ massage: "Inter server error orrures" });
        return;
    }
}

export const templeteCreation = async (req: Request, res: Response) => {
    try {
        //@ts-ignore
        const organizationId = req.userId;
        const templeteSechame = createTemplateSchema.safeParse(req.body);

        if(templeteSechame.error){
            res.status(402).json({masssage:"Invalid Input porvide all required field"});
            return;
        };

        const findDublicateName = await prisma.template.findFirst({
            where:{
                name: templeteSechame.data.name
            }
        });

        if(findDublicateName){
            res.status(StatusCodes.CONFLICT).json({massage:"Templete Name allready exist"});
            return;
        }

        const templeteCreation = await prisma.template.create({
            data:{
                name:templeteSechame.data.name,
                description:templeteSechame.data.description,
                startDate:templeteSechame.data.startDate,
                organizationId:organizationId,
            },
            select: {
                name: true,
                description: true,
                startDate: true
            }
        });

        res.status(StatusCodes.CREATED).json({massage:'Templete Created successfully', templeteCreation})
        return;

    } catch (error) {
        console.log("Error while creating template", error);
        res.status(500).json({ message: "Internal server error occurred" });
    }
};


export const getAllTemplets = async (req:Request, res:Response) =>{
    try {
        //@ts-ignore
        const organizationId = res.userId;

        const getallTemplet = await prisma.template.findMany({
            where:{
                organizationId:organizationId
            }
        });

        if(getallTemplet.length == 0){
            res.status(StatusCodes.OK).json({massage:"No Templet Founded"})
            return;
        }

        res.status(StatusCodes.OK).json({"List Of all Templetes":getallTemplet});
        return;


    } catch (error) {
        console.log("Error occured while featching templetes", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({massage:"Internal Server erroe"});
        return;
    }
}

