-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "status" "LinkStatus" NOT NULL DEFAULT 'ACTIVE';
