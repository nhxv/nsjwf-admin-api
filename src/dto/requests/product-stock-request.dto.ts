import Joi from "joi";

export class ProductStockRequestDto {
  constructor(
    public id: number,
    public quantity: number,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}

export const productStockSchema = Joi.object<ProductStockRequestDto>({
  id: Joi.number().integer().positive().allow(0).required(),
  quantity: Joi.number().integer().positive().allow(0).required(),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
});