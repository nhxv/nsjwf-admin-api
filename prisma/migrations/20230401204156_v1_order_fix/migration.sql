/*
  Warnings:

  - A unique constraint covering the columns `[order_code,unit_code]` on the table `ProductCustomerOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProductCustomerOrder_product_name_order_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "ProductCustomerOrder_order_code_unit_code_key" ON "ProductCustomerOrder"("order_code", "unit_code");
