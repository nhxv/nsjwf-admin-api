import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export interface ProductRequestDto {
  name: string,
  discontinued: boolean,
}

export const productSchema = Joi.object<ProductRequestDto>({
  name: Joi.string().trim().required().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }),
  discontinued: Joi.boolean().required(),
});