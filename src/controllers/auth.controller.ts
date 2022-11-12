import { NextFunction, Request, Response, Router } from "express";
import { login } from "../services/authentication.service";

const router = Router();

router.post(
  "/auth/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await login(req.body);
      res.send({accessToken: tokens.accessToken});
    } catch (error) {
      next(error);
    }
  }
);

export default router;