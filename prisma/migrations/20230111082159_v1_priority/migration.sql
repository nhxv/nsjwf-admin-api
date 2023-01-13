/*
  Warnings:

  - A unique constraint covering the columns `[assign_to,priority,created_at]` on the table `CustomerOrder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `priority` to the `CustomerOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomerOrder" ADD COLUMN     "is_doing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_assign_to_priority_created_at_key" ON "CustomerOrder"("assign_to", "priority", "created_at");
