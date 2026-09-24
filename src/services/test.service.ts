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
    return await prisma.$transaction(
      async (tx) => {
        await tx.customerOrder.deleteMany({});
        await tx.customerReturn.deleteMany({});
        await tx.customerReturnRemain.deleteMany({});
        await tx.orderTaskHistory.deleteMany({});
        await tx.productCustomerOrder.deleteMany({});
        await tx.productCustomerReturn.deleteMany({});
        await tx.productCustomerReturnRemain.deleteMany({});
        await tx.stockChangeHistory.deleteMany({});
        await tx.productVendorOrder.deleteMany({});
        await tx.vendorOrder.deleteMany({});
        await tx.customerPayment.deleteMany({});
        await tx.vendorPayment.deleteMany({});
        await tx.product.updateMany({
          data: {
            recent_cost: null,
          },
        });
        const allStocks = await tx.stock.findMany();
        for (const stock of allStocks) {
          await tx.stock.update({
            where: {
              id: stock.id,
            },
            data: {
              quantity: "0",
              updated_at: stock.created_at,
            },
          });
        }
      },
      // Deleting all operation data can exceed the default 5s interactive transaction timeout.
      { timeout: 60_000 },
    );
  } catch (error) {
    throw new createError.BadRequest(error);
  }
};
