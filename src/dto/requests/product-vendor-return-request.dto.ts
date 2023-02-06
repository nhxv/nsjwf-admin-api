import { Prisma } from "@prisma/client";

export interface ProductVendorReturnRequestDto {
  productName: string,
  quantity: number,
  unitPrice: Prisma.Decimal,
  id?: number,
  returnId?: number,
  createdAt?: Date,
}