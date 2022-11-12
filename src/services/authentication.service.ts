import createError from "http-errors";
import { LoginDto, loginSchema } from "../dto/login.dto";
import * as bcrypt from "bcryptjs";
import { signAccessToken } from "./token.service";

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
  return { accessToken };
}