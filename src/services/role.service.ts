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