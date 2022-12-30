import { NextFunction, Request, Response, Router } from "express";
import { LoginResponseDto } from "../dto/responses/login-response.dto";
import { login } from "../services/auth/authentication.service";

const router = Router();

router.post(
  "/auth/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginRes = await login(req.body);
      res.send(new LoginResponseDto(loginRes.account.nickname, loginRes.account.role_id, loginRes.token));
    } catch (error) {
      next(error);
    }
  }
);

export default router;