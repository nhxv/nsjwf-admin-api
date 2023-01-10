import createError from "http-errors";
import prisma from "../../prisma/prisma-client";

export const getRoles = async () => {
  const roles = await prisma.role.findMany();
  return roles;
}

export const getRoleByName = async (roleName: string) => {
  const role = await prisma.role.findUnique({
    where: {
      name: roleName
    }
  });
  return role;
}

export const nukeConfigure = async () => {
  try {
    const deletedProducts = await prisma.product.deleteMany({});
    const deletedCustomers = await prisma.customer.deleteMany({});
    const deletedVendors = await prisma.vendor.deleteMany({});
    const deletedVehicles = await prisma.vehicle.deleteMany({});
  } catch (error) {
    throw new createError.BadRequest("Try again, master.");
  }
}

export const nukeOperation = async () => {
  try {
    const deletedBackorder = await prisma.backorder.deleteMany({});
    const deletedCustomerOrder = await prisma.customerOrder.deleteMany({});
    const deletedCustomerReturn = await prisma.customerReturn.deleteMany({});
    const deletedCustomerSaleReturn = await prisma.customerSaleReturn.deleteMany({});
    const deletedOrderTaskHistory = await prisma.orderTaskHistory.deleteMany({});
    const deletedOrderTaskType = await prisma.orderTaskType.deleteMany({});
    const deletedProductBackorder = await prisma.productBackorder.deleteMany({});
    const deletedProductCustomerOrder = await prisma.productCustomerOrder.deleteMany({});
    const deletedProductCustomerReturn = await prisma.productCustomerReturn.deleteMany({});
    const deletedProductCustomerSaleReturn = await prisma.productCustomerSaleReturn.deleteMany({});
    const deletedProductStockChangeHistory = await prisma.productStockChangeHistory.deleteMany({});
    const deletedProductVendorOrder = await prisma.productVendorOrder.deleteMany({});
    const deletedProductVendorReturn = await prisma.productVendorReturn.deleteMany({});
    const deletedProductVendorSaleReturn = await prisma.productVendorSaleReturn.deleteMany({});
    const deletedVendorOrder = await prisma.vendorOrder.deleteMany({});
    const deletedVendorReturn = await prisma.vendorReturn.deleteMany({});
    const deletedVendorSaleReturn = await prisma.vendorSaleReturn.deleteMany({});
    return await prisma.$transaction(async (tx) => {
      const allStocks = await tx.productStock.findMany();
      for (const stock of allStocks) {
        const updatedStock = await tx.productStock.update({
          where: {
            id: stock.id,
          },
          data: {
            quantity: 0,
            updated_at: stock.created_at,
          }
        })
      }
    });
  } catch (error) {
    throw new createError.BadRequest("Try again, master.");
  }
}