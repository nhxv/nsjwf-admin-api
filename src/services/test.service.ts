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
    throw new createError.BadRequest("Try again, master");
  }
}