import Joi from "joi";

export interface ProductStockRequestDto {
  id: number,
  quantity: number,
  createdAt?: Date,
  updatedAt?: Date,
}

export const productStockSchema = Joi.object<ProductStockRequestDto>({
  id: Joi.number().integer().positive().allow(0).required(),
  quantity: Joi.number().integer().positive().allow(0).required(),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
});