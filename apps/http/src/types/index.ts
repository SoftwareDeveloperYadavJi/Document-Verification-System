import { z } from "zod";

export const UserRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "ISSUER", "VERIFIER", "DOCUMENT_OWNER"]),
});


export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UserOtpSchema = z.object({
    otp: z.string(),
});


export const UserUpdateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
});


export const UserResetPasswordSchema = z.object({
  email: z.string().email()
});
