/*
  Warnings:

  - You are about to drop the column `final_price` on the `CustomerReturn` table. All the data in the column will be lost.
  - You are about to drop the column `recommended_price` on the `CustomerReturn` table. All the data in the column will be lost.
  - You are about to drop the column `unit_price` on the `ProductCustomerReturn` table. All the data in the column will be lost.
  - You are about to drop the column `unit_price` on the `ProductVendorReturn` table. All the data in the column will be lost.
  - You are about to drop the column `final_price` on the `VendorReturn` table. All the data in the column will be lost.
  - You are about to drop the column `recommended_price` on the `VendorReturn` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[location_name]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `refund` to the `CustomerReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refund` to the `VendorReturn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomerReturn" DROP COLUMN "final_price",
DROP COLUMN "recommended_price",
ADD COLUMN     "refund" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "location_name" VARCHAR(20);

-- AlterTable
ALTER TABLE "ProductCustomerReturn" DROP COLUMN "unit_price";

-- AlterTable
ALTER TABLE "ProductCustomerSaleReturn" ALTER COLUMN "quantity" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ProductVendorReturn" DROP COLUMN "unit_price";

-- AlterTable
ALTER TABLE "ProductVendorSaleReturn" ALTER COLUMN "quantity" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "VendorReturn" DROP COLUMN "final_price",
DROP COLUMN "recommended_price",
ADD COLUMN     "refund" DECIMAL(65,30) NOT NULL;

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_location_name_key" ON "Product"("location_name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_location_name_fkey" FOREIGN KEY ("location_name") REFERENCES "Location"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- InsertLocation
INSERT INTO "Location"("name") VALUES ('Cooler 1');
INSERT INTO "Location"("name") VALUES ('Cooler 2');
INSERT INTO "Location"("name") VALUES ('Cooler 3');

-- UpdateStockChangeReason
UPDATE "StockChangeReason" SET "name" = 'CUSTOMER_ORDER_COMPLETED' WHERE id = 2;