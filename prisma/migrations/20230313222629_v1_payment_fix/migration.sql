/*
  Warnings:

  - A unique constraint covering the columns `[reason,order_code]` on the table `StockChangeHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CustomerOrder" DROP CONSTRAINT "CustomerOrder_payment_code_fkey";

-- AlterTable
ALTER TABLE "StockChangeHistory" ADD COLUMN     "order_code" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX "StockChangeHistory_reason_order_code_key" ON "StockChangeHistory"("reason", "order_code");

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_payment_code_fkey" FOREIGN KEY ("payment_code") REFERENCES "CustomerPayment"("code") ON DELETE SET NULL ON UPDATE CASCADE;
