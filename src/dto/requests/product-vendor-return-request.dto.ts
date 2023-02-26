export interface ProductVendorReturnRequestDto {
  productName: string;
  quantity: number;
  unitCode: string;
  id?: number;
  returnId?: number;
  createdAt?: Date;
}
