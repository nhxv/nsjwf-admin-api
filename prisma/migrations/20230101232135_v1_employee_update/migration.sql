/*
  Warnings:

  - A unique constraint covering the columns `[order_code,type]` on the table `OrderTaskHistory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `OrderTaskHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderTaskHistory" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrderTaskHistory_order_code_type_key" ON "OrderTaskHistory"("order_code", "type");
