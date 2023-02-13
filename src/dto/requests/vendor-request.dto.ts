import { VendorProductTendencyRequestDto } from "./vendor-product-tendency-request.dto";
import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export interface VendorRequestDto {
  name: string;
  discontinued: boolean;
  address?: string;
  phone?: string;
  email?: string;
  presentative?: string;
  vendorProductTendencies?: VendorProductTendencyRequestDto[];
  id?: number;
}

export const vendorSchema = Joi.object<VendorRequestDto>({
  name: Joi.string()
    .required()
    .trim()
    .max(255)
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  discontinued: Joi.boolean().required(),
  address: Joi.string().allow("").regex(GENERAL_TEXT_REGEX, { invert: true }),
  phone: Joi.string()
    .allow("")
    .max(20)
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  email: Joi.string()
    .allow("")
    .email()
    .max(320)
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  presentative: Joi.string()
    .allow("")
    .max(255)
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  vendorProductTendencies: Joi.array().items({
    vendorName: Joi.string()
      .trim()
      .max(255)
      .regex(GENERAL_TEXT_REGEX, { invert: true }),
    productName: Joi.string()
      .trim()
      .max(255)
      .regex(GENERAL_TEXT_REGEX, { invert: true }),
    quantity: Joi.number().integer().min(0),
  }),
  id: Joi.number().positive().integer(),
});
