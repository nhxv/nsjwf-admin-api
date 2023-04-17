import { hasAnyRole } from "../services/auth/authorization.service";
import { NextFunction, Request, Response, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { Role } from "../commons/enums/role.enum";
import { findVendorReturnRemainByCode } from "../services/vendor-return-remain.service";

const router = Router();

// find vendor sale return by sale code
router.get(
  `/vendor-return-remains/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVendorReturnRemainByCode(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
