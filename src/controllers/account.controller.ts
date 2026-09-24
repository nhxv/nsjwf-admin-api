import { EmployeeResponseDto } from "./../dto/responses/employee-response.dto";
import { findActiveEmployeeTasks, findAllEmployees, findActiveEmployees, updateEmployee } from "./../services/account.service";
import { NextFunction, Request, Response, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { hasAnyRole } from "../services/auth/authorization.service";
import { Role } from "../commons/enums/role.enum";

const router = Router();

router.get(`/accounts/employees/all`, [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await findAllEmployees();
    res.send(
      response.map((employee) => {
        const employeeRes: EmployeeResponseDto = {
          id: employee.id,
          nickname: employee.nickname,
          active: employee.active,
        };
        return employeeRes;
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get(
  `/accounts/employees/active`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findActiveEmployees();
      res.send(
        response.map((employee) => {
          const employeeRes: EmployeeResponseDto = {
            id: employee.id,
            nickname: employee.nickname,
            active: employee.active,
          };
          return employeeRes;
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  `/accounts/employee-tasks/:status`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findActiveEmployeeTasks(req.params.status);
      res.send(response);
    } catch (error) {
      next(error);
    }
  },
);

router.put(`/accounts/employees/:id`, [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await updateEmployee(+req.params.id, req.body);
    res.send(response);
  } catch (error) {
    next(error);
  }
});

export default router;
