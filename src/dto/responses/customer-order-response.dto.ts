import { ProductCustomerOrderResponseDto } from "./product-customer-order-response.dto";

export class CustomerOrderResponseDto {
  constructor(
    public customerName: string,
    public isTest: boolean,
    public code: string,
    public status: string,
    public productCustomerOrders: ProductCustomerOrderResponseDto[],
    public expectedAt: Date,
    public assignTo: string,
    public isDoing?: boolean,
    public createdAt?: Date,
    public updatedAt?: Date,
    public fullReturn?: boolean,
    public id?: number,
  ) {}
}