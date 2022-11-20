-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "discontinued" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(20),
    "email" VARCHAR(320),
    "presentative" VARCHAR(255),
    "discontinued" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(20),
    "email" VARCHAR(320),
    "discontinued" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "license_plate" VARCHAR(20) NOT NULL,
    "nickname" VARCHAR(255),
    "volume" INTEGER,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "discontinued" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPriceList" (
    "id" SERIAL NOT NULL,
    "time_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_applied" DATE NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "CustomerPriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProductListing" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "price_list_id" INTEGER NOT NULL,

    CONSTRAINT "CustomerProductListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerOrder" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "time_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_completed" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "shipment_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "counted" BOOLEAN NOT NULL DEFAULT true,
    "pay_due" TIMESTAMP(3),

    CONSTRAINT "CustomerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProductOrder" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "customer_order_id" INTEGER NOT NULL,

    CONSTRAINT "CustomerProductOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatus" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,

    CONSTRAINT "OrderStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPayment" (
    "id" SERIAL NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "time_received" TIMESTAMP(3) NOT NULL,
    "customer_order_id" INTEGER NOT NULL,

    CONSTRAINT "CustomerPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStock" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerShipment" (
    "id" SERIAL NOT NULL,
    "by_vehicle" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "time_started" TIMESTAMP(3) NOT NULL,
    "time_delivered" TIMESTAMP(3),

    CONSTRAINT "CustomerShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingStatus" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,

    CONSTRAINT "ShippingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_license_plate_key" ON "Vehicle"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_code_key" ON "CustomerOrder"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OrderStatus_name_key" ON "OrderStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerShipment_by_vehicle_key" ON "CustomerShipment"("by_vehicle");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingStatus_name_key" ON "ShippingStatus"("name");

-- AddForeignKey
ALTER TABLE "CustomerPriceList" ADD CONSTRAINT "CustomerPriceList_customer_name_fkey" FOREIGN KEY ("customer_name") REFERENCES "Customer"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProductListing" ADD CONSTRAINT "CustomerProductListing_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProductListing" ADD CONSTRAINT "CustomerProductListing_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "CustomerPriceList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_customer_name_fkey" FOREIGN KEY ("customer_name") REFERENCES "Customer"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_status_fkey" FOREIGN KEY ("status") REFERENCES "OrderStatus"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "CustomerShipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProductOrder" ADD CONSTRAINT "CustomerProductOrder_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProductOrder" ADD CONSTRAINT "CustomerProductOrder_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "CustomerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "CustomerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "Product"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerShipment" ADD CONSTRAINT "CustomerShipment_by_vehicle_fkey" FOREIGN KEY ("by_vehicle") REFERENCES "Vehicle"("license_plate") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerShipment" ADD CONSTRAINT "CustomerShipment_status_fkey" FOREIGN KEY ("status") REFERENCES "ShippingStatus"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
