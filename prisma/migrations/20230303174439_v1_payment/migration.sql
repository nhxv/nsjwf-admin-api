/*
  Warnings:

  - A unique constraint covering the columns `[payment_code]` on the table `CustomerOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CustomerOrder" ADD COLUMN     "payment_code" VARCHAR(20);

-- CreateTable
CREATE TABLE "CustomerPayment" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentStatus" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPayment_id_key" ON "CustomerPayment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPayment_code_key" ON "CustomerPayment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentStatus_id_key" ON "PaymentStatus"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentStatus_name_key" ON "PaymentStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_payment_code_key" ON "CustomerOrder"("payment_code");

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_payment_code_fkey" FOREIGN KEY ("payment_code") REFERENCES "CustomerPayment"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_status_fkey" FOREIGN KEY ("status") REFERENCES "PaymentStatus"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- InsertPaymentStatus
INSERT INTO "PaymentStatus"("name") VALUES ('RECEIVABLE');
INSERT INTO "PaymentStatus"("name") VALUES ('CASH');
INSERT INTO "PaymentStatus"("name") VALUES ('CHECK');

-- InsertLocation
INSERT INTO "Location"("name") VALUES ('Others');