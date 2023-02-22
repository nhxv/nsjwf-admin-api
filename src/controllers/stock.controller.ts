import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/enums/role.enum";
import { hasAnyRole } from "../services/auth/authorization.service";
import { verifyAccessToken } from "../services/auth/token.service";
import { findAllStock, updateStock } from "../services/stock.service";

const router = Router();

router.get(
  `/stock`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findAllStock();
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// update stock by product name & status
router.put(
  `/stock`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateStock(
        req.body.stock,
        req.body.reason
      );
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
