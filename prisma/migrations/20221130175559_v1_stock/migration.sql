-- CreateTable
CREATE TABLE "ProductStock" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStockChangeHistory" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" VARCHAR(32) NOT NULL,

    CONSTRAINT "ProductStockChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStockChange" (
    "id" SERIAL NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "change_id" INTEGER NOT NULL,

    CONSTRAINT "ProductStockChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStockChangeReason" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL,

    CONSTRAINT "ProductStockChangeReason_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductStock_product_name_key" ON "ProductStock"("product_name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStockChangeReason_name_key" ON "ProductStockChangeReason"("name");

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockChangeHistory" ADD CONSTRAINT "ProductStockChangeHistory_reason_fkey" FOREIGN KEY ("reason") REFERENCES "ProductStockChangeReason"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockChange" ADD CONSTRAINT "ProductStockChange_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "ProductStock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockChange" ADD CONSTRAINT "ProductStockChange_change_id_fkey" FOREIGN KEY ("change_id") REFERENCES "ProductStockChangeHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- InsertProductStockChangeReason
INSERT INTO "ProductStockChangeReason"("name") VALUES ('VENDOR_ORDER');
INSERT INTO "ProductStockChangeReason"("name") VALUES ('CUSTOMER_ORDER');
INSERT INTO "ProductStockChangeReason"("name") VALUES ('VENDOR_RETURN');
INSERT INTO "ProductStockChangeReason"("name") VALUES ('CUSTOMER_RETURN');
INSERT INTO "ProductStockChangeReason"("name") VALUES ('DAMAGED');
INSERT INTO "ProductStockChangeReason"("name") VALUES ('EMPLOYEE_BORROW');
INSERT INTO "ProductStockChangeReason"("name") VALUES ('SELF');
INSERT INTO "ProductStockChangeReason"("name") VALUES ('UNKNOWN');