import { NextFunction, Request, Response, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { hasAnyRole } from "../services/auth/authorization.service";
import { Role } from "../commons/role.enum";
import { findAllEmployees } from "../services/account.service";
import { EmployeeResponse } from "../dto/responses/employee-response";

const router = Router();

router.get(`/accounts/employees`, 
[verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await findAllEmployees();
    res.send(response.map(employee => new EmployeeResponse(employee.nickname)));
  } catch (error) {
    next(error);
  }
});

export default router;