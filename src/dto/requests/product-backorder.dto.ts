import { Prisma } from "@prisma/client";

export interface ProductBackorderRequestDto {
  productName: string,
  quantity: number,
  unitPrice: Prisma.Decimal,
  id?: number,
  backorderId?: number,
  createdAt?: Date,
  updatedAt?: Date,
  isRemove?: boolean,   
}