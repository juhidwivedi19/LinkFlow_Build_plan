/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `AnalyticsEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AnalyticsEvent" DROP COLUMN "ipAddress",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "hashedIp" TEXT;
