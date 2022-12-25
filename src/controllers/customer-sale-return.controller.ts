import { hasAnyRole } from "./../services/auth/authorization.service";
import { NextFunction, Request, Response, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { Role } from "../commons/role.enum";
import { findCustomerSaleReturnByCode } from "../services/customer-sale-return.service";

const router = Router();

// find customer sale return by sale code
router.get(
  `/customer-sale-returns/:code`, 
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findCustomerSaleReturnByCode(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;