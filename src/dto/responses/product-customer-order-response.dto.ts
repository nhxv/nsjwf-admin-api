import { Prisma } from "@prisma/client";

export interface ProductCustomerOrderResponseDto {
  productName: string;
  quantity: number;
  unitPrice?: Prisma.Decimal;
  id?: number;
  orderCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
