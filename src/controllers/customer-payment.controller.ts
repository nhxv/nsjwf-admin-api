import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/enums/role.enum";
import { hasAnyRole } from "../services/auth/authorization.service";
import { updatePaymentStatus } from "../services/customer-payment.service";
import { verifyAccessToken } from "./../services/auth/token.service";

const router = Router();

// update payment status
router.put(
  `/customer-payment/status/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updatePaymentStatus(req.params.code, req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
