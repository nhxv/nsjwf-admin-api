/*
  Warnings:

  - A unique constraint covering the columns `[manual_code]` on the table `VendorOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "VendorOrder" ADD COLUMN     "manual_code" VARCHAR(12);

-- CreateIndex
CREATE UNIQUE INDEX "VendorOrder_manual_code_key" ON "VendorOrder"("manual_code");
