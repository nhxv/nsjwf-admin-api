import { Prisma } from "@prisma/client";

export interface ProductCustomerReturnResponseDto {
  productName: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  id?: number;
  createdAt?: Date;
}
