import Joi from "joi";
import { ProductVendorOrderRequestDto } from "./product-vendor-order-request.dto";
import { OrderStatus } from "../../commons/enums/order-status.enum";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

interface MulterFileDto {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: any;
}

const attachmentSchema = Joi.object<MulterFileDto>({
  fieldname: Joi.string().required().max(512),
  originalname: Joi.string().max(512),
  encoding: Joi.string(),
  mimetype: Joi.string(),
  size: Joi.number(),
  destination: Joi.string(),
  filename: Joi.string(),
  path: Joi.string(),
  buffer: Joi.any(),
}).optional();

export interface VendorOrderRequestDto {
  vendorName: string;
  productVendorOrders: ProductVendorOrderRequestDto[];
  isTest: boolean;
  expectedAt: Date;
  id?: number;
  code?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  attachment?: MulterFileDto;
}

export const vendorOrderSchema = Joi.object<VendorOrderRequestDto>({
  vendorName: Joi.string()
    .required()
    .max(255)
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  productVendorOrders: Joi.array()
    .items({
      productName: Joi.string()
        .required()
        .max(255)
        .regex(GENERAL_TEXT_REGEX, { invert: true }),
      quantity: Joi.number().integer().positive().required(),
      unitCode: Joi.string().trim().max(21).required(),
      unitPrice: Joi.string().allow(""),
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
  id: Joi.number().integer().positive(),
  code: Joi.string().max(20).regex(GENERAL_TEXT_REGEX, { invert: true }),
  status: Joi.string()
    .max(32)
    .valid(...Object.values(OrderStatus))
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
  attachment: attachmentSchema,
});
