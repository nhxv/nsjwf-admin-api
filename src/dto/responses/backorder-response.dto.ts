import { ProductBackorderResponseDto } from "./product-backorder-response.dto";

export interface BackorderResponseDto {
  customerName: string;
  isTest: boolean;
  productBackorders: ProductBackorderResponseDto[];
  isArchived: boolean;
  expectedAt: Date;
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
}
