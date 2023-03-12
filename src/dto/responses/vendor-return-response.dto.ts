import { Decimal } from "@prisma/client/runtime/library";
import { ProductVendorReturnResponseDto } from "./product-vendor-return-response.dto";

export interface VendorReturnResponseDto {
  vendorName: string;
  orderCode: string;
  productVendorReturns: ProductVendorReturnResponseDto[];
  refund: Decimal;
  createdAt?: Date;
  id?: number;
}
