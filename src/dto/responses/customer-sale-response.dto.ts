import { ProductCustomerOrderResponseDto } from "./product-customer-order-response.dto";
import { CustomerReturnResponseDto } from "./customer-return-response.dto";

export interface CustomerSaleResponseDto {
  customerName: string;
  isTest: boolean;
  orderCode: string;
  sale: string;
  refund: string;
  productCustomerOrders: ProductCustomerOrderResponseDto[];
  returns?: CustomerReturnResponseDto[];
  createdAt?: Date;
  updatedAt?: Date;
  fullReturn?: boolean;
  manualCode?: string;
  paymentStatus?: string;
  id?: number;
}
