import { NextFunction, Request, Response, Router } from "express";
import { LoginResponseDto } from "../dto/login-response.dto";
import { login } from "../services/authentication.service";

const router = Router();

router.post(
  "/auth/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginRes = await login(req.body);
      res.send(new LoginResponseDto(loginRes.username, loginRes.roleId, loginRes.token));
    } catch (error) {
      next(error);
    }
  }
);

export default router;