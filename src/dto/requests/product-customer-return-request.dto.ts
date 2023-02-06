import { Prisma } from "@prisma/client";

export interface ProductCustomerReturnRequestDto {
  productName: string,
  quantity: number,
  unitPrice: Prisma.Decimal,
  id?: number,
  returnId?: number,
  createdAt?: Date,
}