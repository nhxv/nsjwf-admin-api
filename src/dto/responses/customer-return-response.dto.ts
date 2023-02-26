import { Decimal } from "@prisma/client/runtime";
import { ProductCustomerReturnResponseDto } from "./product-customer-return-response.dto";

export interface CustomerReturnResponseDto {
  customerName: string;
  orderCode: string;
  productCustomerReturns: ProductCustomerReturnResponseDto[];
  refund: Decimal;
  createdAt?: Date;
  manualCode?: string;
  id?: number;
}
