/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Patient_shareToken_key" ON "Patient"("shareToken");
