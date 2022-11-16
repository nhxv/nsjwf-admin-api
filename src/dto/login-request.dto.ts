import Joi from "joi";

export class LoginRequestDto {
  constructor(
    public username: string,
    public password: string,
  ) {}
}

export const loginSchema = Joi.object<LoginRequestDto>({
  username: Joi.string().required(),
  password: Joi.string().required(),
});