import Joi from "joi";
import { ProductCustomerOrderRequestDto } from "./product-customer-order-request.dto";
import { OrderStatus } from "../../commons//enums/order-status.enum";
import { GENERAL_TEXT_REGEX, NUMBER_REGEX } from "../../commons/constant";

export interface CustomerOrderRequestDto {
  customerName: string;
  productCustomerOrders: ProductCustomerOrderRequestDto[];
  isTest: boolean;
  expectedAt: Date;
  assignTo: string;
  code?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  manualCode?: string;
  id?: number;
  note?: string;
}

export const customerOrderSchema = Joi.object<CustomerOrderRequestDto>({
  customerName: Joi.string()
    .required()
    .max(255)
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  productCustomerOrders: Joi.array()
    .items({
      productName: Joi.string()
        .required()
        .max(255)
        .regex(GENERAL_TEXT_REGEX, { invert: true }),
      quantity: Joi.number().integer().positive().required(),
      unitCode: Joi.string().trim().max(21).required(),
      unitPrice: Joi.number().min(0).required(),
      id: Joi.number().integer().positive(),
      orderCode: Joi.string()
        .max(20)
        .regex(GENERAL_TEXT_REGEX, { invert: true }),
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
      isRemove: Joi.boolean(),
    })
    .required()
    .min(1),
  isTest: Joi.boolean().required(),
  expectedAt: Joi.date().required(),
  assignTo: Joi.string().max(255).required(),
  id: Joi.number().integer().positive(),
  code: Joi.string().max(20).regex(GENERAL_TEXT_REGEX, { invert: true }),
  status: Joi.string()
    .max(32)
    .valid(...Object.values(OrderStatus))
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
  manualCode: Joi.string().allow("").max(6).regex(NUMBER_REGEX),
  note: Joi.string().allow("").max(128),
});
