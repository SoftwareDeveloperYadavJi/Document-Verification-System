/*
  Warnings:

  - Added the required column `token` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrganizationMember" ADD COLUMN     "token" TEXT NOT NULL;
