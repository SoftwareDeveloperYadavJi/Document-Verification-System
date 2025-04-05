/*
  Warnings:

  - You are about to drop the column `userId` on the `OrganizationMember` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId]` on the table `OrganizationMember` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "OrganizationMember_organizationId_userId_key";

-- AlterTable
ALTER TABLE "OrganizationMember" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_key" ON "OrganizationMember"("organizationId");
