import prisma from "../../../prisma/prisma-client";
import * as bcrypt from "bcryptjs";
import createError from "http-errors";
import { LoginRequestDto, loginSchema } from "../../dto/requests/login-request.dto";
import { signAccessToken } from "./token.service";

export const login = async (loginDto: LoginRequestDto) => {
  const { value: loginData, error } = loginSchema.validate(loginDto);
  if (error) {
    throw new createError.Unauthorized("Wrong username or password.");
  }
  const { username, password } = loginData;
  const account = await prisma.account.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      password: true,
      role_id: true,
      nickname: true,
    },
  });
  if (!account) throw new createError.Unauthorized("Wrong username or password.");
  const isMatch = await bcrypt.compare(password, account.password);
  if (!isMatch) throw new createError.Unauthorized("Wrong username or password.");
  // Other errors (DB down, signing failure) propagate as-is instead of masquerading as 401.
  const accessToken = await signAccessToken(account.id, account.role_id);
  return { account: account, token: accessToken };
};
