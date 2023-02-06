import Joi from "joi";

export interface LoginRequestDto {
  username: string,
  password: string,
}

export const loginSchema = Joi.object<LoginRequestDto>({
  username: Joi.string().required().max(32).regex(/[$\(\)<>]/, { invert: true }),
  password: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }),
});