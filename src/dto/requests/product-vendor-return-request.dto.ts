import { Prisma } from "@prisma/client";

export class ProductVendorReturnRequestDto {
  constructor(
    public productName: string,
    public quantity: number,
    public unitPrice: Prisma.Decimal,
    public id?: number,
    public returnId?: number,
    public createdAt?: Date,
  ) {}
}