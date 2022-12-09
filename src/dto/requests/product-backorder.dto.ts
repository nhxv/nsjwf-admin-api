import { Prisma } from "@prisma/client";

export class ProductBackorderRequestDto {
  constructor(
    public productName: string,
    public quantity: number,
    public unitPrice: Prisma.Decimal,
    public id?: number,
    public backorderId?: number,
    public createdAt?: Date,
    public updatedAt?: Date,
    public isRemove?: boolean,   
  ) {}
}