import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/enums/role.enum";
import { hasAnyRole } from "./../services/auth/authorization.service";
import { verifyAccessToken } from "./../services/auth/token.service";
import { createUnit, updateUnit } from "./../services/unit.service";

const router = Router();

router.post(
  `/units/by-product/:productId`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createUnit(+req.params.productId, req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  `/units/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateUnit(+req.params.id, req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
