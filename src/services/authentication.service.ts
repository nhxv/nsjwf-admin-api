import createError from "http-errors";
import { LoginDto, loginSchema } from "../dto/login.dto";
import * as bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./token.service";
import { LogoutDto, logoutSchema } from "../dto/logout.dto";

export const login = async (loginDto) => {
  const loginData: LoginDto = await loginSchema.validateAsync(loginDto);
  const { username, password } = loginData;
  const account = await prisma.account.findUniqueOrThrow({
    where: {username},
    select: {password: true, id: true, username: true, role_id: true},
  });
  if (!account) throw new createError.Unauthorized("Account not found");
  const isMatch = await bcrypt.compare(password, account?.password || "");
  if (!isMatch) throw new createError.Unauthorized("Wrong username or password");
  const accessToken = await signAccessToken(account.id, account.role_id);
  const refreshToken = null;
  return { accessToken, refreshToken };
}

export const logout = async (logoutDto) => {
  const logoutData: LogoutDto = await logoutSchema.validateAsync(logoutDto);
  const { refreshToken } = logoutData;
  if (!refreshToken) throw new createError.BadRequest();
  const accountId = await verifyRefreshToken(refreshToken);
  const account = await prisma.account.update({ data: { refresh_token: null, access_token: null }, where: { id: accountId } });
  if (!account) throw new createError.InternalServerError();
  return true;
}