import { ProductCustomerReturnResponseDto } from "./product-customer-return-response.dto";

export interface CustomerReturnResponseDto {
  customerName: string,
  orderCode: string,
  productCustomerReturns: ProductCustomerReturnResponseDto[],
  createdAt?: Date,
  manualCode?: string,
  id?: number,  
}