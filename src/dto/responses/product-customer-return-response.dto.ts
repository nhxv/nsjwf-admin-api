import { Prisma } from "@prisma/client";

export interface ProductCustomerReturnResponseDto {
  productName: string;
  quantity: number;
  unitCode: string;
  unitPrice: Prisma.Decimal;
  id?: number;
  createdAt?: Date;
}
