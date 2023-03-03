-- AlterTable
ALTER TABLE "CustomerOrder" ADD COLUMN     "payment_status" VARCHAR(32);

-- CreateTable
CREATE TABLE "PaymentStatus" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentStatus_id_key" ON "PaymentStatus"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentStatus_name_key" ON "PaymentStatus"("name");

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_payment_status_fkey" FOREIGN KEY ("payment_status") REFERENCES "PaymentStatus"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- InsertPaymentStatus
INSERT INTO "PaymentStatus"("name") VALUES ('RECEIVABLE');
INSERT INTO "PaymentStatus"("name") VALUES ('CASH');
INSERT INTO "PaymentStatus"("name") VALUES ('CHECK');

-- InsertLocation
INSERT INTO "Location"("name") VALUES ('Others');