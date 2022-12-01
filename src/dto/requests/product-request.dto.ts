import Joi from "joi";

export class ProductRequestDto {
  constructor(
    public name: string,
    public discontinued: boolean,
  ) {}
}

export const productSchema = Joi.object<ProductRequestDto>({
  // exclude characters: $,(,),<,>
  name: Joi.string().trim().required().max(255).regex(/[$\(\)<>]/, { invert: true }),
  discontinued: Joi.boolean().required(),
});