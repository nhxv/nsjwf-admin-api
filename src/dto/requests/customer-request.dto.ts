import Joi from "joi";

export class CustomerRequestDto {
  constructor(
    public name: string,
    public discontinued: boolean,
    public address?: string,
    public phone?: string,
    public email?: string,
    public presentative?: string,
  ) {}
}

export const customerSchema = Joi.object<CustomerRequestDto>({
  name: Joi.string().required().max(255).regex(/[$\(\)<>]/, { invert: true }),
  discontinued: Joi.boolean().required(),
  address: Joi.string().allow("").regex(/[$\(\)<>]/, { invert: true }),
  phone: Joi.string().allow("").max(20).regex(/[$\(\)<>]/, { invert: true }),
  email: Joi.string().allow("").email().max(320).regex(/[$\(\)<>]/, { invert: true }),
  presentative: Joi.string().allow("").max(255).regex(/[$\(\)<>]/, { invert: true }),
});