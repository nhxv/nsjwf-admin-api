-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "active" BOOLEAN;

UPDATE "Account" SET "active" = true WHERE id = 1;
UPDATE "Account" SET "active" = true WHERE id = 2;
UPDATE "Account" SET "active" = true WHERE id = 3;
UPDATE "Account" SET "active" = true WHERE id = 4;
UPDATE "Account" SET "active" = true WHERE id = 5;
UPDATE "Account" SET "active" = true where id = 6;
UPDATE "Account" SET "active" = true where id = 7;
