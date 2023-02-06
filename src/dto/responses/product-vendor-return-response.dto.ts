import { Prisma } from "@prisma/client";

export interface ProductVendorReturnResponseDto  {
  productName: string,
  quantity: number,
  unitPrice: Prisma.Decimal,
  id?: number,
  createdAt?: Date,  
}