import { ProductCustomerOrderResponseDto } from "./product-customer-order-response.dto";

export class CustomerOrderResponseDto {
  constructor(
    public customerName: string,
    public isTest: boolean,
    public code: string,
    public status: string,
    public productCustomerOrders: ProductCustomerOrderResponseDto[],
    public expectedAt: Date,
    public createdAt?: Date,
    public updatedAt?: Date,
    public id?: number,
    public isInvoice?: boolean,
  ) {}
}