import createError from "http-errors";
import { LoginRequestDto, loginSchema } from "../../dto/requests/login-request.dto";
import * as bcrypt from "bcryptjs";
import { signAccessToken } from "./token.service";

export const login = async (loginDto: LoginRequestDto) => {
  try {
    const loginData: LoginRequestDto = await loginSchema.validateAsync(loginDto);
    const { username, password } = loginData;
    const account = await prisma.account.findUniqueOrThrow({
      where: {username},
      select: {
        id: true, 
        username: true, 
        password: true, 
        role_id: true, 
        nickname: true
      },
    });
    if (!account) throw new createError.Unauthorized("Wrong username or password.");
    const isMatch = await bcrypt.compare(password, account?.password || "");
    if (!isMatch) throw new createError.Unauthorized("Wrong username or password.");
    const accessToken = await signAccessToken(account.id, account.role_id);
    return { "account": account, "token": accessToken };
  } catch (e) {
    throw new createError.Unauthorized("Wrong username or password.");
  }
}