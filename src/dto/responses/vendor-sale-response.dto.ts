import { ProductVendorOrderResponseDto } from "./product-vendor-order-response.dto";

export interface VendorSaleResponseDto {
  vendorName: string;
  isTest: boolean;
  orderCode: string;
  manualCode?: string;
  sale: string;
  productVendorOrders: ProductVendorOrderResponseDto[];
  updatedAt?: Date;
  expectedAt?: Date;
  paymentStatus?: string;
  id?: number;
}
