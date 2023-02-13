import { Prisma } from "@prisma/client";

export interface ProductBackorderResponseDto {
  productName: string;
  quantity: number;
  unitPrice?: Prisma.Decimal;
  id?: number;
  backorderId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
