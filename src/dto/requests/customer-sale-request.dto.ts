import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export interface CustomerSaleRequestDto {
  code?: string;
  date?: string;
  customer?: string;
  product?: string;
}

export const customerSaleSchema = Joi.object<CustomerSaleRequestDto>({
  code: Joi.string()
    .max(6)
    .regex(GENERAL_TEXT_REGEX, { invert: true })
    .optional()
    .allow(""),
  date: Joi.string()
    .max(255)
    .regex(GENERAL_TEXT_REGEX, { invert: true })
    .optional()
    .allow(""),
  customer: Joi.string()
    .max(255)
    .regex(GENERAL_TEXT_REGEX, { invert: true })
    .optional()
    .allow(""),
  product: Joi.string()
    .max(255)
    .regex(GENERAL_TEXT_REGEX, { invert: true })
    .optional()
    .allow(""),
});
