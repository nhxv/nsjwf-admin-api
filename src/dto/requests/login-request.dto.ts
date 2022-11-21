import Joi from "joi";

export class LoginRequestDto {
  constructor(
    public username: string,
    public password: string,
  ) {}
}

export const loginSchema = Joi.object<LoginRequestDto>({
  username: Joi.string().required().max(32).regex(/[$\(\)<>]/, { invert: true }),
  password: Joi.string().required().regex(/[$\(\)<>]/, { invert: true }),
});