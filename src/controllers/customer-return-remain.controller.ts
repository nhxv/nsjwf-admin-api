import { hasAnyRole } from "./../services/auth/authorization.service";
import { NextFunction, Request, Response, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { Role } from "../commons/enums/role.enum";
import { findCustomerReturnRemainByCode } from "../services/customer-return-remain.service";

const router = Router();

// find customer return remain by order code
router.get(
  `/customer-return-remains/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findCustomerReturnRemainByCode(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
