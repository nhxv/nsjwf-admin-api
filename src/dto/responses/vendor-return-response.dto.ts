import { ProductVendorReturnResponseDto } from "./product-vendor-return-response.dto";

export interface VendorReturnResponseDto {
  vendorName: string;
  orderCode: string;
  productVendorReturns: ProductVendorReturnResponseDto[];
  createdAt?: Date;
  id?: number;
}
