/*
  Warnings:

  - Added the required column `address` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zipCode` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Organization` required. This step will fail if there are existing NULL values in that column.
  - Made the column `website` on table `Organization` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Organization` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phoneNumber` on table `Organization` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "zipCode" TEXT NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "website" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phoneNumber" SET NOT NULL;
