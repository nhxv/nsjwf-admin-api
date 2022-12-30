import createError  from "http-errors";
import { Role } from "../commons/role.enum";

export const findAllEmployees = async () => {
  try {
    const employees = await prisma.account.findMany({
      where: {
        role_id: Role.OPERATOR,
      },
      orderBy: {
        nickname: "asc",
      }
    });
    return employees;
  } catch (error) {
    throw new createError.BadRequest("Cannot find backorder.");
  }
}