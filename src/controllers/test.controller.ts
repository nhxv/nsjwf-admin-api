import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/authorization.service";
import { getRoleByName, getRoles } from "../services/role.service";
import { verifyAccessToken } from "../services/token.service";
import { Role } from "../commons/role.enum";

const router = Router();

router.get(
  "/test/roles",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await getRoles();
      res.json(roles);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/test/roles/admin",
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await getRoleByName("ADMIN");
      res.json(role);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/test/roles/operator",
  [verifyAccessToken, hasAnyRole([Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await getRoleByName("OPERATOR");
      res.json(role);
    } catch (error) {
      next(error);
    }
  }
);

export default router;