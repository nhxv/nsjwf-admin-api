import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export interface VendorSaleRequestDto {
  code?: string;
  date?: string;
  vendor?: string;
  product?: string;
}

export const vendorSaleSchema = Joi.object<VendorSaleRequestDto>({
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
  vendor: Joi.string()
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
