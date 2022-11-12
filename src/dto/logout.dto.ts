import Joi from "joi";

export interface LogoutDto {
  refreshToken: string,
}

export const logoutSchema = Joi.object<LogoutDto>({
  refreshToken: Joi.string().required(),
});