import { ProductBackorderRequestDto } from "./product-backorder.dto";
import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export interface BackorderRequestDto {
  customerName: string,
  productBackorders: ProductBackorderRequestDto[],
  isTest: boolean,
  isArchived: boolean,
  expectedAt: Date,
  assignTo: string,
  id?: number,
  createdAt?: Date,
  updatedAt?: Date,
}

export const backorderSchema = Joi.object<BackorderRequestDto>({
  customerName: Joi.string().required().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }),
  productBackorders: Joi.array().items({
    productName: Joi.string().required().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }),
    quantity: Joi.number().integer().positive().required(),
    unitPrice: Joi.number().positive().required(),
    id: Joi.number().integer().positive(),
    backorderId: Joi.number().integer().positive(),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
    isRemove: Joi.boolean(),
  }).required().min(1),
  isTest: Joi.boolean().required(),
  isArchived: Joi.boolean().required(),
  expectedAt: Joi.date().required(),
  assignTo: Joi.string().max(255).required(),
  id: Joi.number().integer().positive(),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
});