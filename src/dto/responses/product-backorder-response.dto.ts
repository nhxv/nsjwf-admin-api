import { Prisma } from "@prisma/client";

export interface ProductBackorderResponseDto {
  productName: string;
  quantity: number;
  unitCode: string;
  unitPrice?: Prisma.Decimal;
  id?: number;
  backorderId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
