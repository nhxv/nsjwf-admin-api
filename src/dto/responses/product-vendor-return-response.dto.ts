import { Prisma } from "@prisma/client";

export class ProductVendorReturnResponseDto {
  constructor(
    public productName: string,
    public quantity: number,
    public unitPrice: Prisma.Decimal,
    public id?: number,
    public createdAt?: Date,
  ) {}
}