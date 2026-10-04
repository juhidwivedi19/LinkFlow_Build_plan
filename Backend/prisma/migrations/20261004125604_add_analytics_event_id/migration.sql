/*
  Warnings:

  - A unique constraint covering the columns `[eventId]` on the table `AnalyticsEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN     "eventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsEvent_eventId_key" ON "AnalyticsEvent"("eventId");
