import { CustomerOrderMiniRequestDto } from "./customer-order-mini-request.dto";

export class CustomerOrderPriorityRequestDto {
  constructor(
    public nickname: string,
    public customerOrders: CustomerOrderMiniRequestDto[],
  ) {}
}