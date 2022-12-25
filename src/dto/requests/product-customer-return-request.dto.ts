import { Prisma } from "@prisma/client";

export class ProductCustomerReturnRequestDto {
  constructor(
    public productName: string,
    public quantity: number,
    public unitPrice: Prisma.Decimal,
    public id?: number,
    public returnId?: number,
    public createdAt?: Date,
  ) {}
}