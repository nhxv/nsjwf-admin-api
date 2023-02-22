import { Prisma } from "@prisma/client";

export interface ProductVendorReturnRequestDto {
  productName: string;
  quantity: number;
  unitCode: string;
  unitPrice: Prisma.Decimal;
  id?: number;
  returnId?: number;
  createdAt?: Date;
}
