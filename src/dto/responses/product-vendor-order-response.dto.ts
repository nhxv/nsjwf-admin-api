import { Prisma } from "@prisma/client";

export interface ProductVendorOrderResponseDto {
  productName: string;
  quantity: number;
  unitCode: string;
  unitPrice?: Prisma.Decimal;
  id?: number;
  orderCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
