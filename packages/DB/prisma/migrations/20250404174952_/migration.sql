/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `OrganizationMember` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_email_key" ON "OrganizationMember"("email");
