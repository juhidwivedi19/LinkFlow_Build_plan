-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "customDomainId" INTEGER;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_customDomainId_fkey" FOREIGN KEY ("customDomainId") REFERENCES "CustomDomain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
