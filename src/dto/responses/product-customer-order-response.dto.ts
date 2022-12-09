import { Prisma } from "@prisma/client";

export class ProductCustomerOrderResponseDto {
  constructor(
    public productName: string,
    public quantity: number,
    public unitPrice?: Prisma.Decimal,
    public id?: number,
    public orderCode?: string,
    public createdAt?: Date,
    public updatedAt?: Date,   
  ) {}
}