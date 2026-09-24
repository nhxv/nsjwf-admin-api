import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

interface IAnalysisDto {
  start_date: string;
  end_date: string;
}

export interface CustomerProductRankingDto extends IAnalysisDto {
  product?: string;
}

export const customerProductRankingSchema = Joi.object<CustomerProductRankingDto>({
  start_date: Joi.string().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }).required(),
  end_date: Joi.string().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }).required(),
  product: Joi.string().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }).optional().allow(""),
});

export interface ProductRankingDto extends IAnalysisDto {}

export const productRankingSchema = Joi.object<ProductRankingDto>({
  start_date: Joi.string().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }).required(),
  end_date: Joi.string().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }).required(),
});
