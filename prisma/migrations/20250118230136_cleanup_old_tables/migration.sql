/*
  Warnings:

  - You are about to drop the `Backorder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductBackorder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductVendorReturn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductVendorReturnRemain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorReturn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorReturnRemain` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Backorder" DROP CONSTRAINT "Backorder_assign_to_fkey";

-- DropForeignKey
ALTER TABLE "Backorder" DROP CONSTRAINT "Backorder_customer_name_fkey";

-- DropForeignKey
ALTER TABLE "ProductBackorder" DROP CONSTRAINT "ProductBackorder_backorder_id_fkey";

-- DropForeignKey
ALTER TABLE "ProductBackorder" DROP CONSTRAINT "ProductBackorder_product_name_fkey";

-- DropForeignKey
ALTER TABLE "ProductBackorder" DROP CONSTRAINT "ProductBackorder_unit_code_fkey";

-- DropForeignKey
ALTER TABLE "ProductVendorReturn" DROP CONSTRAINT "ProductVendorReturn_product_name_fkey";

-- DropForeignKey
ALTER TABLE "ProductVendorReturn" DROP CONSTRAINT "ProductVendorReturn_return_id_fkey";

-- DropForeignKey
ALTER TABLE "ProductVendorReturn" DROP CONSTRAINT "ProductVendorReturn_unit_code_fkey";

-- DropForeignKey
ALTER TABLE "ProductVendorReturnRemain" DROP CONSTRAINT "ProductVendorReturnRemain_product_name_fkey";

-- DropForeignKey
ALTER TABLE "ProductVendorReturnRemain" DROP CONSTRAINT "ProductVendorReturnRemain_unit_code_fkey";

-- DropForeignKey
ALTER TABLE "ProductVendorReturnRemain" DROP CONSTRAINT "ProductVendorReturnRemain_vendor_return_remain_code_fkey";

-- DropForeignKey
ALTER TABLE "VendorReturn" DROP CONSTRAINT "VendorReturn_order_code_fkey";

-- DropForeignKey
ALTER TABLE "VendorReturn" DROP CONSTRAINT "VendorReturn_vendor_name_fkey";

-- DropForeignKey
ALTER TABLE "VendorReturnRemain" DROP CONSTRAINT "VendorReturnRemain_order_code_fkey";

-- DropForeignKey
ALTER TABLE "VendorReturnRemain" DROP CONSTRAINT "VendorReturnRemain_vendor_name_fkey";

-- DropTable
DROP TABLE "Backorder";

-- DropTable
DROP TABLE "ProductBackorder";

-- DropTable
DROP TABLE "ProductVendorReturn";

-- DropTable
DROP TABLE "ProductVendorReturnRemain";

-- DropTable
DROP TABLE "VendorReturn";

-- DropTable
DROP TABLE "VendorReturnRemain";
