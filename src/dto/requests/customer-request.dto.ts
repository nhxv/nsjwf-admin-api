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
  name: Joi.string().trim().required().max(255).regex(/[!#$%^&\*\_+<>?:"{}\[\];,/\t]/, { invert: true }),
  discontinued: Joi.boolean().required(),
  address: Joi.string().allow("").regex(/[!#$%^&\*\_+<>?:"{}\[\];,/\t]/, { invert: true }),
  phone: Joi.string().allow("").max(20).regex(/[!#$%^&\*\_+<>?:"{}\[\];,/\t]/, { invert: true }),
  email: Joi.string().allow("").email().max(320).regex(/[!#$%^&\*\_+<>?:"{}\[\];,/\t]/, { invert: true }),
  presentative: Joi.string().allow("").max(255).regex(/[!#$%^&\*\_+<>?:"{}\[\];,/\t]/, { invert: true }),
});