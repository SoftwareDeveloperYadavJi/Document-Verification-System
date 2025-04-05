/*
  Warnings:

  - Added the required column `name` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrganizationMember" ADD COLUMN     "name" TEXT NOT NULL;
