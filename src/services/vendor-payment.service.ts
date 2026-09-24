import prisma from "../../prisma/prisma-client";
import { VendorPaymentRequestDto } from "./../dto/requests/vendor-payment-request.dto";
import { vendorPaymentSchema } from "./../dto/requests/vendor-payment-request.dto";
import { handleValidationError } from "../commons/http.exception";
import createError from "http-errors";
import { generateCurrentTime } from "../commons/utils/time.util";

export const updatePaymentStatus = async (code: string, vendorPaymentDto: VendorPaymentRequestDto) => {
  try {
    const vendorPaymentData: VendorPaymentRequestDto = await vendorPaymentSchema.validateAsync(vendorPaymentDto);
    const time = generateCurrentTime();
    const updatedVendorPayment = await prisma.vendorPayment.update({
      where: {
        code: code,
      },
      data: {
        status: vendorPaymentData.status,
        updated_at: time,
      },
    });
    return updatedVendorPayment;
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest("Cannot update payment status.");
  }
};
