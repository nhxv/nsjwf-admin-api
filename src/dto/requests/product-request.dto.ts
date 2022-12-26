import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export class ProductRequestDto {
  constructor(
    public name: string,
    public discontinued: boolean,
  ) {}
}

export const productSchema = Joi.object<ProductRequestDto>({
  // exclude characters: $,(,),<,>
  name: Joi.string().trim().required().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }),
  discontinued: Joi.boolean().required(),
});