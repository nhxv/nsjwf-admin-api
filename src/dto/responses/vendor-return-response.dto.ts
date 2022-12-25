import { ProductVendorReturnResponseDto } from "./product-vendor-return-response.dto";

export class VendorReturnResponseDto {
  constructor(
    public vendorName: string,
    public orderCode: string,
    public productVendorReturns: ProductVendorReturnResponseDto[],
    public createdAt?: Date,
    public id?: number,
  ) {}
}