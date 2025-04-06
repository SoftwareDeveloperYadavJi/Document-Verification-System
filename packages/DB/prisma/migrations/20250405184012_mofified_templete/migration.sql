/*
  Warnings:

  - You are about to drop the column `content` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `variables` on the `Template` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Template" DROP COLUMN "content",
DROP COLUMN "variables",
ADD COLUMN     "startDate" TIMESTAMP(3);
