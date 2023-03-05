import createError from "http-errors";
import { Role } from "../commons/enums/role.enum";
import { handleValidationError } from "../commons/http.exception";
import { OrderStatus } from "./../commons/enums/order-status.enum";
import { convertLocalStart } from "./../commons/utils/time.util";
import {
  EmployeeRequestDto,
  employeeSchema,
} from "./../dto/requests/employee-request.dto";

export const findAllEmployees = async () => {
  try {
    const employees = await prisma.account.findMany({
      where: {
        role_id: Role.OPERATOR,
      },
      orderBy: {
        nickname: "asc",
      },
    });
    return employees;
  } catch (error) {
    throw new createError.BadRequest("Cannot find employees.");
  }
};

export const findActiveEmployees = async () => {
  try {
    const employees = await prisma.account.findMany({
      where: {
        role_id: Role.OPERATOR,
        active: true,
      },
      orderBy: {
        nickname: "asc",
      },
    });
    return employees;
  } catch (error) {
    throw new createError.BadRequest("Cannot find employees.");
  }
};

export const findActiveEmployeeTasks = async (status: string) => {
  try {
    if (status !== OrderStatus.PICKING && status !== OrderStatus.SHIPPING) {
      throw `Please don't hack us.`;
    }
    const employees = await prisma.account.findMany({
      where: {
        role_id: Role.OPERATOR,
        active: true,
      },
      select: {
        customerOrders: {
          where: {
            status: status,
            expected_at: {
              gte: convertLocalStart(),
            },
          },
          orderBy: [{ priority: "asc" }, { created_at: "asc" }],
        },
        nickname: true,
      },
      orderBy: {
        nickname: "asc",
      },
    });
    return employees;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot find employees.");
  }
};

export const updateEmployee = async (
  id: number,
  employeeDto: EmployeeRequestDto
) => {
  try {
    const employeeData: EmployeeRequestDto = await employeeSchema.validateAsync(
      employeeDto
    );
    const updatedEmployee = await prisma.account.update({
      where: {
        id: id,
      },
      data: {
        nickname: employeeData.nickname,
        active: employeeData.active,
      },
    });
    return updatedEmployee;
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest("Cannot update employee.");
  }
};
