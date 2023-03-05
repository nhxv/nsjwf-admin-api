import createError from "http-errors";
import prisma from "../../prisma/prisma-client";

export const getRoles = async () => {
  const roles = await prisma.role.findMany();
  return roles;
};

export const getRoleByName = async (roleName: string) => {
  const role = await prisma.role.findUnique({
    where: {
      name: roleName,
    },
  });
  return role;
};

export const nukeConfigure = async () => {
  try {
    const deletedProducts = await prisma.product.deleteMany({});
    const deletedCustomers = await prisma.customer.deleteMany({});
    const deletedVendors = await prisma.vendor.deleteMany({});
    const deletedVehicles = await prisma.vehicle.deleteMany({});
    const deletedUnits = await prisma.unit.deleteMany({});
    const deletedStock = await prisma.stock.deleteMany({});
  } catch (error) {
    throw new createError.BadRequest(error);
  }
};

export const nukeOperation = async () => {
  try {
    const deletedBackorder = await prisma.backorder.deleteMany({});
    const deletedCustomerOrder = await prisma.customerOrder.deleteMany({});
    const deletedCustomerReturn = await prisma.customerReturn.deleteMany({});
    const deletedCustomerSaleReturn =
      await prisma.customerSaleReturn.deleteMany({});
    const deletedOrderTaskHistory = await prisma.orderTaskHistory.deleteMany(
      {}
    );
    const deletedProductBackorder = await prisma.productBackorder.deleteMany(
      {}
    );
    const deletedProductCustomerOrder =
      await prisma.productCustomerOrder.deleteMany({});
    const deletedProductCustomerReturn =
      await prisma.productCustomerReturn.deleteMany({});
    const deletedProductCustomerSaleReturn =
      await prisma.productCustomerSaleReturn.deleteMany({});
    const deletedProductStockChangeHistory =
      await prisma.stockChangeHistory.deleteMany({});
    const deletedProductVendorOrder =
      await prisma.productVendorOrder.deleteMany({});
    const deletedProductVendorReturn =
      await prisma.productVendorReturn.deleteMany({});
    const deletedProductVendorSaleReturn =
      await prisma.productVendorSaleReturn.deleteMany({});
    const deletedVendorOrder = await prisma.vendorOrder.deleteMany({});
    const deletedVendorReturn = await prisma.vendorReturn.deleteMany({});
    const deletedVendorSaleReturn = await prisma.vendorSaleReturn.deleteMany(
      {}
    );
    const updatedProducts = await prisma.product.updateMany({
      data: {
        sell_price: null,
      },
    });
    return await prisma.$transaction(async (tx) => {
      const allStocks = await tx.stock.findMany();
      for (const stock of allStocks) {
        const updatedStock = await tx.stock.update({
          where: {
            id: stock.id,
          },
          data: {
            quantity: "0",
            updated_at: stock.created_at,
          },
        });
      }
    });
  } catch (error) {
    throw new createError.BadRequest(error);
  }
};
