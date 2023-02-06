import { ProductVendorOrderResponseDto } from "./product-vendor-order-response.dto";

export interface VendorOrderResponseDto {
  vendorName: string,
  isTest: boolean,
  code: string,
  status: string,
  productVendorOrders: ProductVendorOrderResponseDto[],
  expectedAt: Date,
  createdAt?: Date,
  updatedAt?: Date,
  fullReturn?: boolean,
  id?: number,
}