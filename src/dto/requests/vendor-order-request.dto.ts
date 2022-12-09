import Joi from "joi";
import { ProductVendorOrderRequestDto } from "./product-vendor-order-request.dto";
import { OrderStatus } from "../../commons/order-status.enum";

export class VendorOrderRequestDto {
  constructor(
    public vendorName: string,
    public productVendorOrders: ProductVendorOrderRequestDto[],
    public isTest: boolean,
    public expectedAt: Date,
    public id?: number,
    public code?: string,
    public status?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}

export const vendorOrderSchema = Joi.object<VendorOrderRequestDto>({
  vendorName: Joi.string().required().max(255).regex(/[$\(\)<>]/, { invert: true }),
  productVendorOrders: Joi.array().items({
    productName: Joi.string().required().max(255).regex(/[$\(\)<>]/, { invert: true }),
    quantity: Joi.number().integer().min(0).required(),
    unitPrice: Joi.number().min(0).required(),
    id: Joi.number().integer().positive().allow(0),
    orderCode: Joi.string().max(20).regex(/[$\(\)<>]/, { invert: true }),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
    isRemove: Joi.boolean(),
  }).required().min(1),
  isTest: Joi.boolean().required(),
  expectedAt: Joi.date().required(),
  id: Joi.number().integer().positive().allow(0),
  code: Joi.string().max(20).regex(/[$\(\)<>]/, { invert: true }),
  status: Joi.string().max(32).valid(...Object.values(OrderStatus)).regex(/[$\(\)<>]/, { invert: true }),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
});