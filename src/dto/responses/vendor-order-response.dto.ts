import { ProductVendorOrderResponseDto } from "./product-vendor-order-response.dto";

export class VendorOrderResponseDto {
  constructor(
    public vendorName: string,
    public isTest: boolean,
    public code: string,
    public status: string,
    public productVendorOrders: ProductVendorOrderResponseDto[],
    public expectedAt: Date,
    public createdAt?: Date,
    public updatedAt?: Date,
    public fullReturn?: boolean,
    public id?: number,
  ) {}
}