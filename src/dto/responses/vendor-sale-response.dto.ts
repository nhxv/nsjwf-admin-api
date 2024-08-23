import { ProductVendorOrderResponseDto } from "./product-vendor-order-response.dto";

export interface VendorSaleResponseDto {
  vendorName: string;
  isTest: boolean;
  orderCode: string;
  manualCode?: string;
  sale: string;
  productVendorOrders: ProductVendorOrderResponseDto[];
  createdAt?: Date;
  updatedAt?: Date;
  paymentStatus?: string;
  id?: number;
}
