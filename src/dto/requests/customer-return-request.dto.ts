import { Prisma } from "@prisma/client";
import { ProductCustomerReturnRequestDto } from "./product-customer-return-request.dto";
import Joi from "joi";

export class CustomerReturnRequestDto {
  constructor(
    public customerName: string,
    public productCustomerReturns: ProductCustomerReturnRequestDto[],
    public orderCode: string,
    public recommendedPrice: Prisma.Decimal,
    public finalPrice: Prisma.Decimal,
    public status?: string,
    public createdAt?: Date,
    public id?: number,
  ) {}
}

export const customerReturnSchema = Joi.object<CustomerReturnRequestDto>({
  customerName: Joi.string().required().max(255).regex(/[!#$%^&\*\_+<>?:"{}\[\];,/\t]/, { invert: true }),
  productCustomerReturns: Joi.array().items({
    productName: Joi.string().required().max(255).regex(/[!#$%^&\*\_+<>?:"{}\[\];,/\t]/, { invert: true }),
    quantity: Joi.number().integer().min(0).required(),
    unitPrice: Joi.number().min(0).required(),
    id: Joi.number().integer().positive().allow(0),
    returnCode: Joi.string().max(20).regex(/[!#$%^&\*\_+<>?:"{}\[\];,/\t]/, { invert: true }),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
    isRemove: Joi.boolean(),
  }).required().min(1),
  orderCode: Joi.string().required().max(20).regex(/[!#$%^&\*\_+<>?:"{}\[\];,/\t]/, { invert: true }),
  recommendedPrice: Joi.number().min(0).required(),
  finalPrice: Joi.number().min(0).required(),
  id: Joi.number().integer().positive().allow(0),
  createdAt: Joi.date(),
});