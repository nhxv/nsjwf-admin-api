import { Prisma } from "@prisma/client";

export interface ProductCustomerOrderRequestDto {
  productName: string,
  quantity: number,
  unitPrice: Prisma.Decimal,
  id?: number,
  orderCode?: string,
  createdAt?: Date,
  updatedAt?: Date,
  isRemove?: boolean, 
}