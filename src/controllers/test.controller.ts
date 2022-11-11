import { NextFunction, Request, Response, Router } from "express";
import { getRoles } from "../services/role.service";

const router = Router();

router.get(
  `/test/roles`,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await getRoles();
      res.json(roles);
    } catch (error) {
      next(error);
    }
  }
);

export default router;