/*
  Warnings:

  - You are about to drop the `CustomerSaleReturn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductCustomerSaleReturn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductVendorSaleReturn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorSaleReturn` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[return_id,unit_code]` on the table `ProductCustomerReturn` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CustomerSaleReturn" DROP CONSTRAINT "CustomerSaleReturn_customer_name_fkey";

-- DropForeignKey
ALTER TABLE "CustomerSaleReturn" DROP CONSTRAINT "CustomerSaleReturn_sale_code_fkey";

-- DropForeignKey
ALTER TABLE "ProductCustomerSaleReturn" DROP CONSTRAINT "ProductCustomerSaleReturn_customer_sale_return_code_fkey";

-- DropForeignKey
ALTER TABLE "ProductCustomerSaleReturn" DROP CONSTRAINT "ProductCustomerSaleReturn_product_name_fkey";

-- DropForeignKey
ALTER TABLE "ProductCustomerSaleReturn" DROP CONSTRAINT "ProductCustomerSaleReturn_unit_code_fkey";

-- DropForeignKey
ALTER TABLE "ProductVendorSaleReturn" DROP CONSTRAINT "ProductVendorSaleReturn_product_name_fkey";

-- DropForeignKey
ALTER TABLE "ProductVendorSaleReturn" DROP CONSTRAINT "ProductVendorSaleReturn_unit_code_fkey";

-- DropForeignKey
ALTER TABLE "ProductVendorSaleReturn" DROP CONSTRAINT "ProductVendorSaleReturn_vendor_sale_return_code_fkey";

-- DropForeignKey
ALTER TABLE "VendorSaleReturn" DROP CONSTRAINT "VendorSaleReturn_sale_code_fkey";

-- DropForeignKey
ALTER TABLE "VendorSaleReturn" DROP CONSTRAINT "VendorSaleReturn_vendor_name_fkey";

-- DropTable
DROP TABLE "CustomerSaleReturn";

-- DropTable
DROP TABLE "ProductCustomerSaleReturn";

-- DropTable
DROP TABLE "ProductVendorSaleReturn";

-- DropTable
DROP TABLE "VendorSaleReturn";

-- CreateTable
CREATE TABLE "VendorReturnRemain" (
    "id" SERIAL NOT NULL,
    "order_code" VARCHAR(20) NOT NULL,
    "vendor_name" VARCHAR(255) NOT NULL,
    "sold_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorReturnRemain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVendorReturnRemain" (
    "id" SERIAL NOT NULL,
    "vendor_return_remain_code" VARCHAR(20) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" TEXT NOT NULL,
    "unit_code" VARCHAR(21) NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ProductVendorReturnRemain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReturnRemain" (
    "id" SERIAL NOT NULL,
    "order_code" VARCHAR(20) NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "sold_at" TIMESTAMP(3) NOT NULL,
    "order_manual_code" VARCHAR(6),

    CONSTRAINT "CustomerReturnRemain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCustomerReturnRemain" (
    "id" SERIAL NOT NULL,
    "customer_return_remain_code" VARCHAR(20) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" TEXT NOT NULL,
    "unit_code" VARCHAR(21) NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ProductCustomerReturnRemain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorReturnRemain_order_code_key" ON "VendorReturnRemain"("order_code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVendorReturnRemain_vendor_return_remain_code_product_key" ON "ProductVendorReturnRemain"("vendor_return_remain_code", "product_name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReturnRemain_order_code_key" ON "CustomerReturnRemain"("order_code");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReturnRemain_order_manual_code_key" ON "CustomerReturnRemain"("order_manual_code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCustomerReturnRemain_customer_return_remain_code_uni_key" ON "ProductCustomerReturnRemain"("customer_return_remain_code", "unit_code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCustomerReturn_return_id_unit_code_key" ON "ProductCustomerReturn"("return_id", "unit_code");

-- AddForeignKey
ALTER TABLE "VendorReturnRemain" ADD CONSTRAINT "VendorReturnRemain_order_code_fkey" FOREIGN KEY ("order_code") REFERENCES "VendorOrder"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorReturnRemain" ADD CONSTRAINT "VendorReturnRemain_vendor_name_fkey" FOREIGN KEY ("vendor_name") REFERENCES "Vendor"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorReturnRemain" ADD CONSTRAINT "ProductVendorReturnRemain_vendor_return_remain_code_fkey" FOREIGN KEY ("vendor_return_remain_code") REFERENCES "VendorReturnRemain"("order_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorReturnRemain" ADD CONSTRAINT "ProductVendorReturnRemain_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorReturnRemain" ADD CONSTRAINT "ProductVendorReturnRemain_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReturnRemain" ADD CONSTRAINT "CustomerReturnRemain_order_code_fkey" FOREIGN KEY ("order_code") REFERENCES "CustomerOrder"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReturnRemain" ADD CONSTRAINT "CustomerReturnRemain_customer_name_fkey" FOREIGN KEY ("customer_name") REFERENCES "Customer"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerReturnRemain" ADD CONSTRAINT "ProductCustomerReturnRemain_customer_return_remain_code_fkey" FOREIGN KEY ("customer_return_remain_code") REFERENCES "CustomerReturnRemain"("order_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerReturnRemain" ADD CONSTRAINT "ProductCustomerReturnRemain_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerReturnRemain" ADD CONSTRAINT "ProductCustomerReturnRemain_unit_code_fkey" FOREIGN KEY ("unit_code") REFERENCES "Unit"("code") ON DELETE CASCADE ON UPDATE CASCADE;
