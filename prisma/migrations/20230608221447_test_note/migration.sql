/*
  Warnings:

  - You are about to alter the column `note` on the `CustomerOrder` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(128)`.

*/
-- AlterTable
ALTER TABLE "CustomerOrder" ALTER COLUMN "note" SET DATA TYPE VARCHAR(128);
