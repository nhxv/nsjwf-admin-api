import { Prisma } from "@prisma/client";

export class ProductCustomerReturnResponseDto {
  constructor(
    public productName: string,
    public quantity: number,
    public unitPrice: Prisma.Decimal,
    public id?: number,
    public createdAt?: Date,
  ) {}
}