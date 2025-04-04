/*
  Warnings:

  - Added the required column `email` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrganizationMember" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "pin" TEXT;
