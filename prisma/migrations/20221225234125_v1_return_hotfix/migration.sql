/*
  Warnings:

  - You are about to drop the column `sale_off` on the `CustomerReturn` table. All the data in the column will be lost.
  - You are about to drop the column `sale_off` on the `VendorReturn` table. All the data in the column will be lost.
  - Added the required column `final_price` to the `CustomerReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommended_price` to the `CustomerReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `final_price` to the `VendorReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommended_price` to the `VendorReturn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomerReturn" DROP COLUMN "sale_off",
ADD COLUMN     "final_price" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "recommended_price" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "VendorReturn" DROP COLUMN "sale_off",
ADD COLUMN     "final_price" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "recommended_price" DECIMAL(65,30) NOT NULL;
