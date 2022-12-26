import { ProductVendorReturnRequestDto } from "./product-vendor-return-request.dto";
import Joi from "joi";
import { Prisma } from "@prisma/client";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export class VendorReturnRequestDto {
  constructor(
    public vendorName: string,
    public productVendorReturns: ProductVendorReturnRequestDto[],
    public orderCode: string,
    public recommendedPrice: Prisma.Decimal,
    public finalPrice: Prisma.Decimal,
    public status?: string,
    public createdAt?: Date,
    public id?: number,
  ) {}
}

export const vendorReturnSchema = Joi.object<VendorReturnRequestDto>({
  vendorName: Joi.string().required().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }),
  productVendorReturns: Joi.array().items({
    productName: Joi.string().required().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }),
    quantity: Joi.number().integer().min(0).required(),
    unitPrice: Joi.number().min(0).required(),
    id: Joi.number().integer().positive().allow(0),
    returnCode: Joi.string().max(20).regex(GENERAL_TEXT_REGEX, { invert: true }),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
    isRemove: Joi.boolean(),
  }).required().min(1),
  orderCode: Joi.string().required().max(20).regex(GENERAL_TEXT_REGEX, { invert: true }),
  recommendedPrice: Joi.number().min(0).required(),
  finalPrice: Joi.number().min(0).required(),
  id: Joi.number().integer().positive().allow(0),
  createdAt: Joi.date(),
});