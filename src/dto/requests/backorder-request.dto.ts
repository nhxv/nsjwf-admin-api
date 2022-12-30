import { ProductBackorderRequestDto } from "./product-backorder.dto";
import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export class BackorderRequestDto {
  constructor(
    public customerName: string,
    public productBackorders: ProductBackorderRequestDto[],
    public isTest: boolean,
    public isArchived: boolean,
    public expectedAt: Date,
    public assignTo: string,
    public id?: number,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}

export const backorderSchema = Joi.object<BackorderRequestDto>({
  customerName: Joi.string().required().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }),
  productBackorders: Joi.array().items({
    productName: Joi.string().required().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }),
    quantity: Joi.number().integer().min(0).required(),
    unitPrice: Joi.number().min(0).required(),
    id: Joi.number().integer().positive().allow(0),
    backorderId: Joi.number().integer().positive().allow(0),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
    isRemove: Joi.boolean(),
  }).required().min(1),
  isTest: Joi.boolean().required(),
  isArchived: Joi.boolean().required(),
  expectedAt: Joi.date().required(),
  assignTo: Joi.string().max(255).required(),
  id: Joi.number().integer().positive().allow(0),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
});