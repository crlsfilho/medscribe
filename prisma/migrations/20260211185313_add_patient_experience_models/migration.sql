/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shareToken]` on the table `Visit` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "shareToken" TEXT;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "carePlan" TEXT,
ADD COLUMN     "laymanSummary" TEXT,
ADD COLUMN     "returnChecklist" TEXT,
ADD COLUMN     "shareToken" TEXT;

-- CreateTable
CREATE TABLE "PreConsultation" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "chiefComplaint" TEXT,
    "history" TEXT,
    "medications" TEXT,
    "allergies" TEXT,
    "surgeries" TEXT,
    "familyHistory" TEXT,
    "lifestyle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "filledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreConsultation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreConsultation_appointmentId_key" ON "PreConsultation"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_shareToken_key" ON "Appointment"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_shareToken_key" ON "Visit"("shareToken");

-- AddForeignKey
ALTER TABLE "PreConsultation" ADD CONSTRAINT "PreConsultation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
