import { NextFunction, Request, Response, Router } from "express";
import { LoginResponseDto } from "../dto/responses/login-response.dto";
import { login } from "../services/auth/authentication.service";

const router = Router();

router.post(
  "/auth/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await login(req.body);
      const loginRes: LoginResponseDto = {
        nickname: response.account.nickname,
        roleId: response.account.role_id,
        token: response.token,
      };
      res.send(loginRes);
    } catch (error) {
      next(error);
    }
  }
);

export default router;