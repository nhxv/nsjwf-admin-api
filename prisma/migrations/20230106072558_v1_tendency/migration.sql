-- CreateTable
CREATE TABLE "VendorProductTendency" (
    "id" SERIAL NOT NULL,
    "vendor_name" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "VendorProductTendency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProductTendency" (
    "id" SERIAL NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "CustomerProductTendency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorProductTendency_vendor_name_name_key" ON "VendorProductTendency"("vendor_name", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProductTendency_customer_name_name_key" ON "CustomerProductTendency"("customer_name", "name");

-- AddForeignKey
ALTER TABLE "VendorProductTendency" ADD CONSTRAINT "VendorProductTendency_vendor_name_fkey" FOREIGN KEY ("vendor_name") REFERENCES "Vendor"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProductTendency" ADD CONSTRAINT "VendorProductTendency_name_fkey" FOREIGN KEY ("name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProductTendency" ADD CONSTRAINT "CustomerProductTendency_customer_name_fkey" FOREIGN KEY ("customer_name") REFERENCES "Customer"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProductTendency" ADD CONSTRAINT "CustomerProductTendency_name_fkey" FOREIGN KEY ("name") REFERENCES "Product"("name") ON DELETE CASCADE ON UPDATE CASCADE;
