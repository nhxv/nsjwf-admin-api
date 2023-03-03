import { ProductCustomerOrderResponseDto } from "./product-customer-order-response.dto";

export interface CustomerOrderResponseDto {
  customerName: string;
  isTest: boolean;
  code: string;
  status: string;
  productCustomerOrders: ProductCustomerOrderResponseDto[];
  expectedAt: Date;
  assignTo: string;
  isDoing?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  fullReturn?: boolean;
  manualCode?: string;
  paymentStatus?: string;
  id?: number;
}
