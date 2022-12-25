/*
  Warnings:

  - You are about to drop the column `is_invoice` on the `CustomerOrder` table. All the data in the column will be lost.
  - You are about to drop the column `is_invoice` on the `VendorOrder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code,is_sold]` on the table `CustomerOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,is_sold]` on the table `VendorOrder` will be added. If there are existing duplicate values, this will fail.
  - Made the column `updated_at` on table `Backorder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `CustomerOrder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `ProductBackorder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `ProductCustomerOrder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `ProductStock` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `ProductVendorOrder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `VendorOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "CustomerOrder_code_is_invoice_key";

-- DropIndex
DROP INDEX "VendorOrder_code_is_invoice_key";

-- AlterTable
ALTER TABLE "Backorder" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "CustomerOrder" DROP COLUMN "is_invoice",
ADD COLUMN     "is_sold" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductBackorder" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductCustomerOrder" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductStock" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductVendorOrder" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "VendorOrder" DROP COLUMN "is_invoice",
ADD COLUMN     "is_sold" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "updated_at" SET NOT NULL;

-- CreateTable
CREATE TABLE "VendorReturn" (
    "id" SERIAL NOT NULL,
    "vendor_name" VARCHAR(255) NOT NULL,
    "order_code" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "sale_off" INTEGER NOT NULL,

    CONSTRAINT "VendorReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVendorReturn" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "return_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVendorReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSaleReturn" (
    "id" SERIAL NOT NULL,
    "sale_code" VARCHAR(20) NOT NULL,
    "vendor_name" VARCHAR(255) NOT NULL,
    "sold_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSaleReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVendorSaleReturn" (
    "id" SERIAL NOT NULL,
    "vendor_sale_return_code" VARCHAR(20) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ProductVendorSaleReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReturn" (
    "id" SERIAL NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "order_code" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "sale_off" INTEGER NOT NULL,

    CONSTRAINT "CustomerReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCustomerReturn" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "return_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCustomerReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSaleReturn" (
    "id" SERIAL NOT NULL,
    "sale_code" VARCHAR(20) NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "sold_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSaleReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCustomerSaleReturn" (
    "id" SERIAL NOT NULL,
    "customer_sale_return_code" VARCHAR(20) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ProductCustomerSaleReturn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorSaleReturn_sale_code_key" ON "VendorSaleReturn"("sale_code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVendorSaleReturn_vendor_sale_return_code_product_nam_key" ON "ProductVendorSaleReturn"("vendor_sale_return_code", "product_name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSaleReturn_sale_code_key" ON "CustomerSaleReturn"("sale_code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCustomerSaleReturn_customer_sale_return_code_product_key" ON "ProductCustomerSaleReturn"("customer_sale_return_code", "product_name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_code_is_sold_key" ON "CustomerOrder"("code", "is_sold");

-- CreateIndex
CREATE UNIQUE INDEX "VendorOrder_code_is_sold_key" ON "VendorOrder"("code", "is_sold");

-- AddForeignKey
ALTER TABLE "VendorReturn" ADD CONSTRAINT "VendorReturn_vendor_name_fkey" FOREIGN KEY ("vendor_name") REFERENCES "Vendor"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorReturn" ADD CONSTRAINT "VendorReturn_order_code_fkey" FOREIGN KEY ("order_code") REFERENCES "VendorOrder"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorReturn" ADD CONSTRAINT "ProductVendorReturn_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorReturn" ADD CONSTRAINT "ProductVendorReturn_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "VendorReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSaleReturn" ADD CONSTRAINT "VendorSaleReturn_sale_code_fkey" FOREIGN KEY ("sale_code") REFERENCES "VendorOrder"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSaleReturn" ADD CONSTRAINT "VendorSaleReturn_vendor_name_fkey" FOREIGN KEY ("vendor_name") REFERENCES "Vendor"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorSaleReturn" ADD CONSTRAINT "ProductVendorSaleReturn_vendor_sale_return_code_fkey" FOREIGN KEY ("vendor_sale_return_code") REFERENCES "VendorSaleReturn"("sale_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorSaleReturn" ADD CONSTRAINT "ProductVendorSaleReturn_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReturn" ADD CONSTRAINT "CustomerReturn_customer_name_fkey" FOREIGN KEY ("customer_name") REFERENCES "Customer"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReturn" ADD CONSTRAINT "CustomerReturn_order_code_fkey" FOREIGN KEY ("order_code") REFERENCES "CustomerOrder"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerReturn" ADD CONSTRAINT "ProductCustomerReturn_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerReturn" ADD CONSTRAINT "ProductCustomerReturn_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "CustomerReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSaleReturn" ADD CONSTRAINT "CustomerSaleReturn_sale_code_fkey" FOREIGN KEY ("sale_code") REFERENCES "CustomerOrder"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSaleReturn" ADD CONSTRAINT "CustomerSaleReturn_customer_name_fkey" FOREIGN KEY ("customer_name") REFERENCES "Customer"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerSaleReturn" ADD CONSTRAINT "ProductCustomerSaleReturn_customer_sale_return_code_fkey" FOREIGN KEY ("customer_sale_return_code") REFERENCES "CustomerSaleReturn"("sale_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerSaleReturn" ADD CONSTRAINT "ProductCustomerSaleReturn_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- UpdateProductStockChangeReason
UPDATE "ProductStockChangeReason" SET "name" = 'VENDOR_ORDER_COMPLETED' WHERE id = 1;

-- InsertOrderStatus
INSERT INTO "OrderStatus"("name") VALUES ('COMPLETED');