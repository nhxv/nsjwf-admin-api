/*
  Warnings:

  - You are about to drop the column `sell_price` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "sell_price",
ADD COLUMN     "recent_cost" DECIMAL(65,30);
