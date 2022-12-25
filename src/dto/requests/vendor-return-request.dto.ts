import { ProductVendorReturnRequestDto } from "./product-vendor-return-request.dto";
import Joi from "joi";

export class VendorReturnRequestDto {
  constructor(
    public vendorName: string,
    public productVendorReturns: ProductVendorReturnRequestDto[],
    public orderCode: string,
    public saleOff: number,
    public status?: string,
    public createdAt?: Date,
    public id?: number,
  ) {}
}

export const vendorReturnSchema = Joi.object<VendorReturnRequestDto>({
  vendorName: Joi.string().required().max(255).regex(/[!#$%^&\*\_+<>?:"{}\[\];,/\t]/, { invert: true }),
  productVendorReturns: Joi.array().items({
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
  saleOff: Joi.number().min(0).max(100).required(),
  id: Joi.number().integer().positive().allow(0),
  createdAt: Joi.date(),
});