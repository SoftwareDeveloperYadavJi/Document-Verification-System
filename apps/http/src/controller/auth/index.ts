import { Request, Response } from "express";
import { prisma } from "@repo/db/client";
import { StatusCodes } from "http-status-codes";
import { UserRegisterSchema, UserLoginSchema, UserResetPasswordSchema } from "../../types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Email } from "../../utils/email.user";

export const register = async (req: Request, res: Response) => {
    try {
        const userData = UserRegisterSchema.safeParse(req.body);
        if (!userData.success) {
             res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid request body" });
             return;
        }

        const user = await prisma.user.findUnique({
            where: {
                email: userData.data.email,
            },
        });
        if (user) {
             res.status(StatusCodes.BAD_REQUEST).json({ message: "User already exists" });
             return;
        }

        await prisma.user.create({
            include: {
                roles: true,
            },
            data: {
                email: userData.data.email,
                password: await bcrypt.hash(userData.data.password, 10),
                firstName: userData.data.firstName,
                lastName: userData.data.lastName,
                phoneNumber: userData.data.phoneNumber,
                roles:{
                    create: {
                        role: userData.data.role,
                    }
                }
            },
          
        });

        res.status(StatusCodes.CREATED).json({ message: "User registered successfully" });
        return;
        
    } catch (error) {
        console.log("Error occured while registering user", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};


export const login = async (req: Request, res: Response) => {
    try {

        const userData = UserLoginSchema.safeParse(req.body);
     
        if (!userData.success) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid request body" , errors: userData.error.issues });
            return;
        }

        const user = await prisma.user.findUnique({
            where: {
                email: userData.data.email,
            },
            include: {
                roles: true,
            },
        });

        if (!user) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid credentials" });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(userData.data.password, user.password);
        if (!isPasswordCorrect) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid credentials" });
            return;
        }

        if(!user.roles?.[0]?.role){
            res.status(StatusCodes.BAD_REQUEST).json({ message: "User Role is not Defined" });
            return;
        }

        const token = jwt.sign({ userId: user.id, role: user.roles[0].role }, process.env.JWT_SECRET as string, {
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


export const resetPassword = async (req: Request, res: Response) => {
    try {
        const userData = UserResetPasswordSchema.safeParse(req.body);
        if (!userData.success) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid request body" , errors: userData.error.issues });
            return;
        }

        const user = await prisma.user.findUnique({
            where: {
                email: userData.data.email,
            },
        });

        if (!user) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid credentials" });
            return;
        }

        const generatedToken = jwt.sign({ userId: user.id }, process.env.JWT_PASSWORD_RESET_TOKEN as string, {
            expiresIn: "1h",
        });

        await prisma.passwordReset.create({
            data: {
                userId: user.id,
                token: generatedToken,
                expiresAt: new Date(new Date().getTime() + 3600000),
            },
        });

        await new Email().sendPasswordResetEmail(user.email, generatedToken);

        res.status(StatusCodes.OK).json({ message: "Password reset successful" });
        return;
        
    } catch (error) {
        console.log("Error occured while resetting password", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};



export const resetPasswordVarification = async (req: Request, res: Response) => {
    try {
        
        const toker = req.query.token as string;
        const  password = req.body.password as string;

        const verifyToken = jwt.verify(toker, process.env.JWT_PASSWORD_RESET_TOKEN as string);

        if (!verifyToken) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid token" });
            return;
        }

        const user = await prisma.passwordReset.findUnique({
            where: {
                //@ts-ignore
                userId: verifyToken.userId,
                token: toker,
            }
        });

        if (!user) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid token" });
            return;
        }

        const isExpired = user.expiresAt < new Date();
        if (isExpired) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Token expired" });
            return;
        }

        const isUsed = user.usedAt ? true : false;
        if (isUsed) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Token already used" });
            return;
        }

        await prisma.passwordReset.update({
            where: {
                token: toker,
            },
            data: {
                usedAt: true,
            }
        });

        await prisma.user.update({
            where: {
                id: user.userId,
            },
            data: {
                password: await bcrypt.hash(password, 10),
            }
        });

        res.status(StatusCodes.OK).json({ message: "Password updated successfully" });
        return;

    } catch (error) {
        console.log("Error occured while resetting password", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        return;
    }
};




