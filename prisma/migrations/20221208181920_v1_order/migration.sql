/*
  Warnings:

  - Added the required column `quantity_change` to the `ProductStockChange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductStock" ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProductStockChange" ADD COLUMN     "quantity_change" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ProductStockChangeHistory" ALTER COLUMN "created_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "VendorOrder" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "vendor_name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),
    "expected_at" TIMESTAMP(3) NOT NULL,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "is_invoice" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VendorOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVendorOrder" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "order_code" VARCHAR(20) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ProductVendorOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerOrder" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),
    "expected_at" TIMESTAMP(3) NOT NULL,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "is_invoice" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CustomerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCustomerOrder" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "order_code" VARCHAR(20) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ProductCustomerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatus" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL,

    CONSTRAINT "OrderStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backorder" (
    "id" SERIAL NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),
    "expected_at" TIMESTAMP(3) NOT NULL,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Backorder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBackorder" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "backorder_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ProductBackorder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorOrder_code_key" ON "VendorOrder"("code");

-- CreateIndex
CREATE UNIQUE INDEX "VendorOrder_code_is_invoice_key" ON "VendorOrder"("code", "is_invoice");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVendorOrder_product_name_order_code_key" ON "ProductVendorOrder"("product_name", "order_code");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_code_key" ON "CustomerOrder"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_code_is_invoice_key" ON "CustomerOrder"("code", "is_invoice");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCustomerOrder_product_name_order_code_key" ON "ProductCustomerOrder"("product_name", "order_code");

-- CreateIndex
CREATE UNIQUE INDEX "OrderStatus_name_key" ON "OrderStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Backorder_id_is_archived_key" ON "Backorder"("id", "is_archived");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBackorder_product_name_backorder_id_key" ON "ProductBackorder"("product_name", "backorder_id");

-- AddForeignKey
ALTER TABLE "VendorOrder" ADD CONSTRAINT "VendorOrder_vendor_name_fkey" FOREIGN KEY ("vendor_name") REFERENCES "Vendor"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOrder" ADD CONSTRAINT "VendorOrder_status_fkey" FOREIGN KEY ("status") REFERENCES "OrderStatus"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorOrder" ADD CONSTRAINT "ProductVendorOrder_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVendorOrder" ADD CONSTRAINT "ProductVendorOrder_order_code_fkey" FOREIGN KEY ("order_code") REFERENCES "VendorOrder"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_customer_name_fkey" FOREIGN KEY ("customer_name") REFERENCES "Customer"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_status_fkey" FOREIGN KEY ("status") REFERENCES "OrderStatus"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerOrder" ADD CONSTRAINT "ProductCustomerOrder_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomerOrder" ADD CONSTRAINT "ProductCustomerOrder_order_code_fkey" FOREIGN KEY ("order_code") REFERENCES "CustomerOrder"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_customer_name_fkey" FOREIGN KEY ("customer_name") REFERENCES "Customer"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBackorder" ADD CONSTRAINT "ProductBackorder_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBackorder" ADD CONSTRAINT "ProductBackorder_backorder_id_fkey" FOREIGN KEY ("backorder_id") REFERENCES "Backorder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UpdateProductStockChangeReason
UPDATE "ProductStockChangeReason" SET "name" = 'VENDOR_ORDER_DELIVERED' WHERE id = 1;
UPDATE "ProductStockChangeReason" SET "name" = 'CUSTOMER_ORDER_CREATE' WHERE id = 2;
UPDATE "ProductStockChangeReason" SET "name" = 'CUSTOMER_ORDER_EDIT' WHERE id = 3;
UPDATE "ProductStockChangeReason" SET "name" = 'VENDOR_RETURN_RECEIVED' WHERE id = 4;
UPDATE "ProductStockChangeReason" SET "name" = 'CUSTOMER_RETURN_RECEIVED' WHERE id = 5;
UPDATE "ProductStockChangeReason" SET "name" = 'DAMAGED' WHERE id = 6;
UPDATE "ProductStockChangeReason" SET "name" = 'EMPLOYEE_BORROW' WHERE id = 7;
UPDATE "ProductStockChangeReason" SET "name" = 'SELF_CREATE' WHERE id = 8;
INSERT INTO "ProductStockChangeReason"("name") VALUES ('SELF_EDIT');
INSERT INTO "ProductStockChangeReason"("name") VALUES ('UNKNOWN');

-- InsertOrderStatus
INSERT INTO "OrderStatus"("name") VALUES ('PICKING');
INSERT INTO "OrderStatus"("name") VALUES ('CHECKING');
INSERT INTO "OrderStatus"("name") VALUES ('SHIPPING');
INSERT INTO "OrderStatus"("name") VALUES ('DELIVERED');
INSERT INTO "OrderStatus"("name") VALUES ('CANCELED');