import { ProductCustomerOrderResponseDto } from "./product-customer-order-response.dto";

export interface CustomerSaleResponseDto {
  customerName: string;
  isTest: boolean;
  orderCode: string;
  sale: string;
  productCustomerOrders: ProductCustomerOrderResponseDto[];
  createdAt?: Date;
  updatedAt?: Date;
  manualCode?: string;
  paymentStatus?: string;
  id?: number;
}
