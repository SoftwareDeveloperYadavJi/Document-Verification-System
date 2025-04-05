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


export const OrganizationSchema = z.object({
  name: z.string(),
  password: z.string(),
  description: z.string(),
  logoUrl: z.string(),
  website: z.string(),
  phoneNumber: z.string(),
  email: z.string().email(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
});

export const OrganizationMemberSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  pin: z.string().optional(),
  role: z.enum(["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "ISSUER", "VERIFIER", "DOCUMENT_OWNER"]),
});

export const OrganixationLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

