import { ProductCustomerOrderResponseDto } from "./product-customer-order-response.dto";

export interface CustomerSaleResponseDto {
  customerName: string;
  isTest: boolean;
  orderCode: string;
  sale: string;
  productCustomerOrders: ProductCustomerOrderResponseDto[];
  invoiceDate?: Date; // The date on the physical invoice, not when created on the app.
  completedAt?: Date;
  manualCode?: string;
  paymentStatus?: string;
  id?: number;
}
