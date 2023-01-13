import { OrderStatus } from "./../commons/order-status.enum";
import { convertLocalStart } from "./../commons/time.util";
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
    throw new createError.BadRequest("Cannot find employees.");
  }
}

export const findAllEmployeeTasks = async (status: string) => {
  try {
    if (status !== OrderStatus.PICKING && status !== OrderStatus.SHIPPING) {
      throw `Please don't hack us.`;
    }
    const employees = await prisma.account.findMany({
      where: {
        role_id: Role.OPERATOR,
      },
      select: {
        customerOrders: {
          where: {
            status: status,
            expected_at: {
              gte: convertLocalStart(),
            }
          },
          orderBy: [
            {priority: "asc"},
            {created_at: "asc"},
          ]
        },
        nickname: true,
      },
      orderBy: {
        nickname: "asc",
      }
    });
    return employees;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot find employees.");
  }
}