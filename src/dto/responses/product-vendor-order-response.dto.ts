import { Prisma } from "@prisma/client";

export interface ProductVendorOrderResponseDto {
  productName: string,
  quantity: number,
  unitPrice?: Prisma.Decimal,
  id?: number,
  orderCode?: string,
  createdAt?: Date,
  updatedAt?: Date,   
}