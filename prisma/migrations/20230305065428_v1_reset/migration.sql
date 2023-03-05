-- DropForeignKey
ALTER TABLE "OrderTaskHistory" DROP CONSTRAINT "OrderTaskHistory_type_fkey";

-- AddForeignKey
ALTER TABLE "OrderTaskHistory" ADD CONSTRAINT "OrderTaskHistory_type_fkey" FOREIGN KEY ("type") REFERENCES "OrderTaskType"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
