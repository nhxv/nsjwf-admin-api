/*
  Warnings:

  - You are about to drop the `ProductStock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductStockChange` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductStockChangeHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductStockChangeReason` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `unit_code` to the `CustomerProductTendency` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_code` to the `ProductBackorder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_code` to the `ProductCustomerOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_code` to the `ProductCustomerReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_code` to the `ProductCustomerSaleReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_code` to the `ProductVendorOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_code` to the `ProductVendorReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_code` to the `ProductVendorSaleReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_code` to the `VendorProductTendency` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductStock" DROP CONSTRAINT "ProductStock_product_name_fkey";

-- DropForeignKey
ALTER TABLE "ProductStockChange" DROP CONSTRAINT "ProductStockChange_change_id_fkey";

-- DropForeignKey
ALTER TABLE "ProductStockChange" DROP CONSTRAINT "ProductStockChange_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "ProductStockChangeHistory" DROP CONSTRAINT "ProductStockChangeHistory_reason_fkey";

-- AlterTable
ALTER TABLE "CustomerProductTendency" ADD COLUMN     "unit_code" VARCHAR(21) NOT NULL;

-- AlterTable
ALTER TABLE "ProductBackorder" ADD COLUMN     "unit_code" VARCHAR(21) NOT NULL;

-- AlterTable
ALTER TABLE "ProductCustomerOrder" ADD COLUMN     "unit_code" VARCHAR(21) NOT NULL;

-- AlterTable
ALTER TABLE "ProductCustomerReturn" ADD COLUMN     "unit_code" VARCHAR(21) NOT NULL;

-- AlterTable
ALTER TABLE "ProductCustomerSaleReturn" ADD COLUMN     "unit_code" VARCHAR(21) NOT NULL;

-- AlterTable
ALTER TABLE "ProductVendorOrder" ADD COLUMN     "unit_code" VARCHAR(21) NOT NULL;

-- AlterTable
ALTER TABLE "ProductVendorReturn" ADD COLUMN     "unit_code" VARCHAR(21) NOT NULL;

-- AlterTable
ALTER TABLE "ProductVendorSaleReturn" ADD COLUMN     "unit_code" VARCHAR(21) NOT NULL;

-- AlterTable
ALTER TABLE "VendorProductTendency" ADD COLUMN     "unit_code" VARCHAR(21) NOT NULL;

-- DropTable
DROP TABLE "ProductStock";

-- DropTable
DROP TABLE "ProductStockChange";

-- DropTable
DROP TABLE "ProductStockChangeHistory";

-- DropTable
DROP TABLE "ProductStockChangeReason";

-- CreateTable
CREATE TABLE "Unit" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(10) NOT NULL,
    "code" VARCHAR(21) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "ratio" VARCHAR(4) NOT NULL,
    "discontinued" BOOLEAN NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockChangeHistory" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "reason" VARCHAR(32) NOT NULL,

    CONSTRAINT "StockChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockChange" (
    "id" SERIAL NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "change_id" INTEGER NOT NULL,
    "quantity_change" TEXT NOT NULL,

    CONSTRAINT "StockChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockChangeReason" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL,

    CONSTRAINT "StockChangeReason_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_product_name_key" ON "Unit"("name", "product_name");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_product_name_key" ON "Stock"("product_name");

-- CreateIndex
CREATE UNIQUE INDEX "StockChangeReason_name_key" ON "StockChangeReason"("name");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockChangeHistory" ADD CONSTRAINT "StockChangeHistory_reason_fkey" FOREIGN KEY ("reason") REFERENCES "StockChangeReason"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockChange" ADD CONSTRAINT "StockChange_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockChange" ADD CONSTRAINT "StockChange_change_id_fkey" FOREIGN KEY ("change_id") REFERENCES "StockChangeHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorOrder" ADD CONSTRAINT "ProductVendorOrder_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerOrder" ADD CONSTRAINT "ProductCustomerOrder_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBackorder" ADD CONSTRAINT "ProductBackorder_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorReturn" ADD CONSTRAINT "ProductVendorReturn_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorSaleReturn" ADD CONSTRAINT "ProductVendorSaleReturn_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerReturn" ADD CONSTRAINT "ProductCustomerReturn_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerSaleReturn" ADD CONSTRAINT "ProductCustomerSaleReturn_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProductTendency" ADD CONSTRAINT "VendorProductTendency_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProductTendency" ADD CONSTRAINT "CustomerProductTendency_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- InsertStockChangeReason
INSERT INTO "StockChangeReason"("name") VALUES ('VENDOR_ORDER_COMPLETED');
INSERT INTO "StockChangeReason"("name") VALUES ('CUSTOMER_ORDER_CREATE');
INSERT INTO "StockChangeReason"("name") VALUES ('CUSTOMER_ORDER_EDIT');
INSERT INTO "StockChangeReason"("name") VALUES ('VENDOR_RETURN_RECEIVED');
INSERT INTO "StockChangeReason"("name") VALUES ('CUSTOMER_RETURN_RECEIVED');
INSERT INTO "StockChangeReason"("name") VALUES ('DAMAGED');
INSERT INTO "StockChangeReason"("name") VALUES ('EMPLOYEE_BORROW');
INSERT INTO "StockChangeReason"("name") VALUES ('SELF_ADD');
INSERT INTO "StockChangeReason"("name") VALUES ('SELF_USE');
INSERT INTO "StockChangeReason"("name") VALUES ('UNKNOWN');