import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export interface CustomerSaleRequestDto {
  code?: string;
  start_date?: string;
  end_date?: string;
  customer?: string;
  product?: string;
  date_type?: string;
}

export const customerSaleSchema = Joi.object<CustomerSaleRequestDto>({
  code: Joi.string().max(6).regex(GENERAL_TEXT_REGEX, { invert: true }).optional().allow(""),
  start_date: Joi.string().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }).optional().allow(""),
  end_date: Joi.string().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }).optional().allow(""),
  customer: Joi.string().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }).optional().allow(""),
  product: Joi.string().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }).optional().allow(""),
  date_type: Joi.string().max(16).optional().allow("", "expected_at", "updated_at"),
});
