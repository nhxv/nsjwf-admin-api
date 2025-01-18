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
    const deletedCustomerOrder = await prisma.customerOrder.deleteMany({});
    const deletedCustomerReturn = await prisma.customerReturn.deleteMany({});
    const deletedCustomerReturnRemain =
      await prisma.customerReturnRemain.deleteMany({});
    const deletedOrderTaskHistory = await prisma.orderTaskHistory.deleteMany(
      {}
    );
    const deletedProductCustomerOrder =
      await prisma.productCustomerOrder.deleteMany({});
    const deletedProductCustomerReturn =
      await prisma.productCustomerReturn.deleteMany({});
    const deletedProductCustomerReturnRemain =
      await prisma.productCustomerReturnRemain.deleteMany({});
    const deletedProductStockChangeHistory =
      await prisma.stockChangeHistory.deleteMany({});
    const deletedProductVendorOrder =
      await prisma.productVendorOrder.deleteMany({});
    const deletedVendorOrder = await prisma.vendorOrder.deleteMany({});
    const deletedCustomerPayment = await prisma.customerPayment.deleteMany({});
    const deletedVendorPayment = await prisma.vendorPayment.deleteMany({});
    const updatedProducts = await prisma.product.updateMany({
      data: {
        recent_cost: null,
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
