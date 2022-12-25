import { ProductCustomerReturnResponseDto } from "./product-customer-return-response.dto";

export class CustomerReturnResponseDto {
  constructor(
    public customerName: string,
    public orderCode: string,
    public productCustomerReturns: ProductCustomerReturnResponseDto[],
    public createdAt?: Date,
    public id?: number,
  ) {}
}