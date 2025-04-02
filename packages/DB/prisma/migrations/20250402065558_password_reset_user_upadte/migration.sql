/*
  Warnings:

  - The `usedAt` column on the `PasswordReset` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PasswordReset" DROP COLUMN "usedAt",
ADD COLUMN     "usedAt" BOOLEAN NOT NULL DEFAULT false;
