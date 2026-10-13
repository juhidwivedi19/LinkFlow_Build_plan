/*
  Warnings:

  - A unique constraint covering the columns `[userId,type,linkId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "linkId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_type_linkId_key" ON "Notification"("userId", "type", "linkId");
