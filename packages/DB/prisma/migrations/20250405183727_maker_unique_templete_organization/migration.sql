/*
  Warnings:

  - A unique constraint covering the columns `[name,organizationId]` on the table `Template` will be added. If there are existing duplicate values, this will fail.
  - Made the column `signedAt` on table `Document` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "signedAt" SET NOT NULL,
ALTER COLUMN "signedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Template_name_organizationId_key" ON "Template"("name", "organizationId");
