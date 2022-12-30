/*
  Warnings:

  - A unique constraint covering the columns `[nickname]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assign_to` to the `Backorder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assign_to` to the `CustomerOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "nickname" VARCHAR(255);

-- AlterTable
ALTER TABLE "Backorder" ADD COLUMN     "assign_to" VARCHAR(32) NOT NULL;

-- AlterTable
ALTER TABLE "CustomerOrder" ADD COLUMN     "assign_to" VARCHAR(32) NOT NULL;

-- CreateTable
CREATE TABLE "OrderTaskHistory" (
    "id" SERIAL NOT NULL,
    "order_code" VARCHAR(20) NOT NULL,
    "employee_name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTaskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTaskType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL,

    CONSTRAINT "OrderTaskType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderTaskType_name_key" ON "OrderTaskType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Account_nickname_key" ON "Account"("nickname");

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_assign_to_fkey" FOREIGN KEY ("assign_to") REFERENCES "Account"("nickname") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_assign_to_fkey" FOREIGN KEY ("assign_to") REFERENCES "Account"("nickname") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTaskHistory" ADD CONSTRAINT "OrderTaskHistory_order_code_fkey" FOREIGN KEY ("order_code") REFERENCES "CustomerOrder"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTaskHistory" ADD CONSTRAINT "OrderTaskHistory_employee_name_fkey" FOREIGN KEY ("employee_name") REFERENCES "Account"("nickname") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTaskHistory" ADD CONSTRAINT "OrderTaskHistory_type_fkey" FOREIGN KEY ("type") REFERENCES "OrderTaskType"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- UpdateAccount
UPDATE "Account" SET "nickname" = 'Master', "password" = '$2a$12$E7fMBVgE.YzZkEC/EMES9unGGVKInCSAEDxjwx4IedNauM60oAEg6' WHERE id = 1;
UPDATE "Account" SET "nickname" = 'Admin', "password" = '$2a$12$wDmPkTTmFyrzL3qE4F1V8ughuCxO5pNpF.caCSTzNLtnrSM/gKZwq' WHERE id = 2;
UPDATE "Account" SET "nickname" = 'Binh', "username" = 'binh', "password" = '$2a$12$YOPT58vBBn3nKwBfs7RMV.VQq87s.HSgH/oVJ15jObZ4H0J9ssnE6' WHERE id = 3;

-- InsertAccount
INSERT INTO "Account" ("username", "password", "nickname", "role_id") VALUES ('hue', '$2a$12$CHLJyBLTSh0Xn5oF6RTRMu8ygLLD23m8.x/OUCJkDhziNsbPRauS.', 'Hue', 3);
INSERT INTO "Account" ("username", "password", "nickname", "role_id") VALUES ('phong', '$2a$12$ci/zz5FCU.PUGOunb9.7Le6nLEYm/diovc3NE94YKtIx65b2NKz4O', 'Phong', 3);
INSERT INTO "Account" ("username", "password", "nickname", "role_id") VALUES ('cuong', '$2a$12$9DvBWxzp1l7nb3FWKv0UDuRPY0cJOjScKP4uh6LrvfcqI.B0Jh02W', 'Cuong', 3);
INSERT INTO "Account" ("username", "password", "nickname", "role_id") VALUES ('tuan', '$2a$12$mGfW3dJHaBqEnFIPGLkxYe0CNy/v8jrK9BI53lVUmj3SH5dluOanK', 'Tuan', 3);

-- InsertOrderTaskType
INSERT INTO "OrderTaskType" ("name") VALUES ('PICKING');
INSERT INTO "OrderTaskType" ("name") VALUES ('CHECKING');
INSERT INTO "OrderTaskType" ("name") VALUES ('SHIPPING');