import { Request, Response } from "express";
import { prisma } from "@repo/db/client";
import { StatusCodes } from "http-status-codes";
import { generateKeyPairSync, createSign } from "crypto"




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


