import Joi from "joi";
import { PaymentStatus } from "../../commons/enums/payment-status.enum";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export interface VendorPaymentRequestDto {
  status: string;
}

export const vendorPaymentSchema = Joi.object<VendorPaymentRequestDto>({
  status: Joi.string()
    .max(32)
    .valid(...Object.values(PaymentStatus))
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
});
