import { z } from "zod";

export const UserRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "ISSUER", "DOCUMENT_OWNER"]),
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

export const OrganizationLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const OrganizationUpdateSchema = z.object({
  name: z.string().optional(),
  password: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  website: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string(),
  description: z.string(),
  startDate: z.string().transform((val) => new Date(val))
});

export const documentSchemaToSing = z.object({
  // this Hava to done by today morning and by addning QR singturte the informating and get in the userDashBored 
  //  and we have to perform implement the some kind of statrgy to verfiry the doc and decide a  pricec modle and the API request 

});
