/*
  Warnings:

  - Made the column `eventId` on table `AnalyticsEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AnalyticsEvent" ALTER COLUMN "eventId" SET NOT NULL;
