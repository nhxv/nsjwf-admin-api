import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";
import { Location } from "../../commons/enums/location.enum";

export interface ProductRequestDto {
  name: string;
  location?: string;
  discontinued: boolean;
}

export const productSchema = Joi.object<ProductRequestDto>({
  name: Joi.string().trim().required().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }),
  location: Joi.string()
    .trim()
    .max(20)
    .valid(...Object.values(Location))
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  discontinued: Joi.boolean().required(),
});
