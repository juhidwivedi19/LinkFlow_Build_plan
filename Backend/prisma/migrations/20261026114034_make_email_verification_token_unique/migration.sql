/*
  Warnings:

  - A unique constraint covering the columns `[emailVerificationToken]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_emailVerificationToken_key" ON "user"("emailVerificationToken");
