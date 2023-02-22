import { Prisma } from "@prisma/client";

export interface ProductVendorReturnResponseDto {
  productName: string;
  quantity: number;
  unitCode: string;
  unitPrice: Prisma.Decimal;
  id?: number;
  createdAt?: Date;
}
