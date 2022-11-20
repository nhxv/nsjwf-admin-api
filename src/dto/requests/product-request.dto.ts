import Joi from "joi";

export class ProductRequestDto {
  constructor(
    public name: string,
    public discontinued?: boolean,
  ) {}
}

export const productSchema = Joi.object<ProductRequestDto>({
  name: Joi.string().required().max(255).regex(/[$\(\)<>]/, { invert: true }),
  discontinued: Joi.boolean().required(),
});