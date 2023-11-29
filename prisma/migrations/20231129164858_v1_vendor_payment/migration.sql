/*
  Warnings:

  - A unique constraint covering the columns `[payment_code]` on the table `VendorOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "VendorOrder" ADD COLUMN     "payment_code" VARCHAR(20);

-- CreateTable
CREATE TABLE "VendorPayment" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorPayment_id_key" ON "VendorPayment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPayment_code_key" ON "VendorPayment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "VendorOrder_payment_code_key" ON "VendorOrder"("payment_code");

-- AddForeignKey
ALTER TABLE "VendorOrder" ADD CONSTRAINT "VendorOrder_payment_code_fkey" FOREIGN KEY ("payment_code") REFERENCES "VendorPayment"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_status_fkey" FOREIGN KEY ("status") REFERENCES "PaymentStatus"("name") ON DELETE CASCADE ON UPDATE CASCADE;
