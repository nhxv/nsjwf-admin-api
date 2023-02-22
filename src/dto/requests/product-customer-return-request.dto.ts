import { Prisma } from "@prisma/client";

export interface ProductCustomerReturnRequestDto {
  productName: string;
  quantity: number;
  unitCode: string;
  unitPrice: Prisma.Decimal;
  id?: number;
  returnId?: number;
  createdAt?: Date;
}
