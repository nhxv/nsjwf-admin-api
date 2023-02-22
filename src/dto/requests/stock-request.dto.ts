import { GENERAL_TEXT_REGEX } from "./../../commons/constant";
import Joi from "joi";
import { FRACTION_REGEX } from "../../commons/constant";

export interface StockRequestDto {
  productName: string;
  quantity: number;
  unitCode: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const stockSchema = Joi.object<StockRequestDto>({
  productName: Joi.string().trim().max(255).required().regex(GENERAL_TEXT_REGEX, { invert: true }),
  quantity: Joi.number().integer().positive().required(),
  unitCode: Joi.string().max(255).required(),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
});
