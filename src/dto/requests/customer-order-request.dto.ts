import Joi from "joi";
import { ProductCustomerOrderRequestDto } from "./product-customer-order-request.dto";
import { OrderStatus } from "../../commons/order-status.enum";

export class CustomerOrderRequestDto {
  constructor(
    public customerName: string,
    public productCustomerOrders: ProductCustomerOrderRequestDto[],
    public isTest: boolean,
    public expectedAt: Date,
    public code?: string,
    public status?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
    public id?: number,
  ) {}
}

export const customerOrderSchema = Joi.object<CustomerOrderRequestDto>({
  customerName: Joi.string().required().max(255).regex(/[^A-Za-z0-9 &\-'()]/, { invert: true }),
  productCustomerOrders: Joi.array().items({
    productName: Joi.string().required().max(255).regex(/[^A-Za-z0-9 &\-'()]/, { invert: true }),
    quantity: Joi.number().integer().min(0).required(),
    unitPrice: Joi.number().min(0).required(),
    id: Joi.number().integer().positive().allow(0),
    orderCode: Joi.string().max(20).regex(/[^A-Za-z0-9 &\-'()]/, { invert: true }),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
    isRemove: Joi.boolean(),
  }).required().min(1),
  isTest: Joi.boolean().required(),
  expectedAt: Joi.date().required(),
  id: Joi.number().integer().positive().allow(0),
  code: Joi.string().max(20).regex(/[^A-Za-z0-9 &\-'()]/, { invert: true }),
  status: Joi.string().max(32).valid(...Object.values(OrderStatus)).regex(/[^A-Za-z0-9 &\-'()]/, { invert: true }),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
});