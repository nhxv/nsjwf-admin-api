import { ProductBackorderResponseDto } from './product-backorder-response.dto';

export class BackorderResponseDto {
  constructor(
    public customerName: string,
    public isTest: boolean,
    public productBackorders: ProductBackorderResponseDto[],
    public isArchived: boolean,
    public expectedAt: Date,
    public id: number,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}