/*
  Warnings:

  - A unique constraint covering the columns `[attachment]` on the table `VendorOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "VendorOrder" ADD COLUMN     "attachment" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "VendorOrder_attachment_key" ON "VendorOrder"("attachment");
