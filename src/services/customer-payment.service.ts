import prisma from "../../prisma/prisma-client";
import { CustomerPaymentRequestDto } from "./../dto/requests/customer-payment-request.dto";
import { customerPaymentSchema } from "./../dto/requests/customer-payment-request.dto";
import { handleValidationError } from "../commons/http.exception";
import createError from "http-errors";
import { generateCurrentTime } from "../commons/utils/time.util";

export const updatePaymentStatus = async (code: string, customerPaymentDto: CustomerPaymentRequestDto) => {
  try {
    const customerPaymentData: CustomerPaymentRequestDto = await customerPaymentSchema.validateAsync(customerPaymentDto);
    const time = generateCurrentTime();
    const updatedCustomerPayment = await prisma.customerPayment.update({
      where: {
        code: code,
      },
      data: {
        status: customerPaymentData.status,
        updated_at: time,
      },
    });
    return updatedCustomerPayment;
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest("Cannot update payment status.");
  }
};
