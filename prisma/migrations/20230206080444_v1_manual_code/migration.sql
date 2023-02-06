/*
  Warnings:

  - A unique constraint covering the columns `[manual_code]` on the table `CustomerOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sale_manual_code]` on the table `CustomerSaleReturn` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CustomerOrder" ADD COLUMN     "manual_code" VARCHAR(6);

-- AlterTable
ALTER TABLE "CustomerSaleReturn" ADD COLUMN     "sale_manual_code" VARCHAR(6);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_manual_code_key" ON "CustomerOrder"("manual_code");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSaleReturn_sale_manual_code_key" ON "CustomerSaleReturn"("sale_manual_code");
